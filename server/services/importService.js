const crypto = require("crypto");
const Chunk = require("../models/Chunk");
const Delivery = require("../models/Delivery");
const { parseFile } = require("./fileParser");
const { autoDetectMapping } = require("../utils/columnMap");
const { normalizeRow, parseDateTime } = require("../utils/normalize");

const BATCH_SIZE = 500;

function hashBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function generateChunkCode(chunkName) {
  const prefix =
    String(chunkName || "CHK")
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 3)
      .toUpperCase() || "CHK";
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${date}-${rand}`;
}

function previewFile(buffer, filename) {
  const { headers, rows } = parseFile(buffer, filename);
  const mapping = autoDetectMapping(headers);
  return {
    headers,
    totalRows: rows.length,
    preview: rows.slice(0, 20),
    mapping,
    fileHash: hashBuffer(buffer),
  };
}

async function findDuplicateFile(fileHash) {
  return Chunk.findOne({ fileHash }).lean();
}

/**
 * Imports a parsed file into a new chunk. Runs bulk inserts in batches.
 */
async function importFile({ buffer, filename, fileSize, meta, mapping, onProgress }) {
  const { headers, rows } = parseFile(buffer, filename);
  const finalMapping =
    mapping && Object.keys(mapping).length ? mapping : autoDetectMapping(headers);

  const chunkName = meta.chunkName || filename.replace(/\.[^.]+$/, "");
  const chunkCode = meta.chunkCode || generateChunkCode(chunkName);

  const chunk = await Chunk.create({
    chunkCode,
    chunkName,
    originalFileName: filename,
    fileType: filename.split(".").pop().toLowerCase(),
    fileSize: fileSize || buffer.length,
    fileHash: hashBuffer(buffer),
    broadcastName: meta.broadcastName || "",
    templateName: meta.templateName || "",
    notes: meta.notes || "",
    reportDate: meta.reportDate ? parseDateTime(meta.reportDate) : null,
    totalRows: rows.length,
    status: "Processing",
    columnMapping: finalMapping,
  });

  const context = {
    chunkId: chunk._id,
    chunkName: chunk.chunkName,
    chunkCode: chunk.chunkCode,
    broadcastName: chunk.broadcastName,
    templateName: chunk.templateName,
  };

  const invalid = [];
  const seenFingerprints = new Set();
  let duplicateRows = 0;
  let imported = 0;
  let batch = [];
  let detectedTemplate = chunk.templateName;
  let detectedBroadcast = chunk.broadcastName;

  const flush = async () => {
    if (!batch.length) return;
    try {
      await Delivery.insertMany(batch, { ordered: false });
      imported += batch.length;
    } catch (e) {
      const inserted = e && e.result ? e.result.insertedCount || 0 : 0;
      imported += inserted;
    }
    batch = [];
    if (typeof onProgress === "function") onProgress(imported, rows.length);
  };

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const { valid, reason, record } = normalizeRow(row, finalMapping, context);

    if (!valid) {
      invalid.push({ rowNumber: i + 2, reason, row });
      continue;
    }

    if (!detectedTemplate && record.templateName) detectedTemplate = record.templateName;
    if (!detectedBroadcast && record.broadcastName) detectedBroadcast = record.broadcastName;

    if (seenFingerprints.has(record.rowFingerprint)) {
      duplicateRows += 1;
      record.isDuplicate = true;
    } else {
      seenFingerprints.add(record.rowFingerprint);
    }

    batch.push(record);
    if (batch.length >= BATCH_SIZE) await flush();
  }

  await flush();

  const update = {
    importedRows: imported,
    duplicateRows,
    invalidRows: invalid.length,
    failedImports: rows.length - imported - invalid.length,
    status: "Completed",
  };
  if (!chunk.templateName && detectedTemplate) update.templateName = detectedTemplate;
  if (!chunk.broadcastName && detectedBroadcast) update.broadcastName = detectedBroadcast;

  const propagate = {};
  if (update.templateName) propagate.templateName = update.templateName;
  if (update.broadcastName) propagate.broadcastName = update.broadcastName;
  if (Object.keys(propagate).length) {
    await Delivery.updateMany(
      { chunkId: chunk._id, $or: [{ templateName: "" }, { broadcastName: "" }] },
      { $set: propagate }
    );
  }

  const updated = await Chunk.findByIdAndUpdate(chunk._id, update, { new: true }).lean();

  return {
    chunk: updated,
    summary: {
      totalRows: rows.length,
      imported,
      duplicates: duplicateRows,
      invalid: invalid.length,
    },
    invalidRows: invalid.slice(0, 5000),
    mapping: finalMapping,
    headers,
  };
}

module.exports = {
  importFile,
  previewFile,
  findDuplicateFile,
  hashBuffer,
  generateChunkCode,
};

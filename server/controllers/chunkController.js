const mongoose = require("mongoose");
const Chunk = require("../models/Chunk");
const Delivery = require("../models/Delivery");
const { asyncHandler } = require("../middleware/errorHandler");
const { importFile, previewFile, findDuplicateFile } = require("../services/importService");
const { parsePagination, safeRegex } = require("../utils/queryBuilder");

const listChunks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.search) {
    const rx = safeRegex(req.query.search);
    filter.$or = [
      { chunkName: rx },
      { chunkCode: rx },
      { broadcastName: rx },
      { templateName: rx },
      { originalFileName: rx },
    ];
  }
  if (req.query.status) filter.status = req.query.status;

  const [chunks, total] = await Promise.all([
    Chunk.find(filter).sort({ uploadDate: -1 }).skip(skip).limit(limit).lean(),
    Chunk.countDocuments(filter),
  ]);

  const ids = chunks.map((c) => c._id);
  const stats = await Delivery.aggregate([
    { $match: { chunkId: { $in: ids } } },
    { $group: { _id: { chunkId: "$chunkId", status: "$status" }, count: { $sum: 1 } } },
  ]);

  const byChunk = {};
  for (const row of stats) {
    const key = String(row._id.chunkId);
    byChunk[key] = byChunk[key] || { total: 0 };
    byChunk[key][row._id.status] = row.count;
    byChunk[key].total += row.count;
  }

  res.json({
    success: true,
    data: chunks.map((c) => ({ ...c, stats: byChunk[String(c._id)] || { total: 0 } })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

const getChunk = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid chunk id" });
  }
  const chunk = await Chunk.findById(req.params.id).lean();
  if (!chunk) return res.status(404).json({ success: false, message: "Chunk not found" });

  const stats = await Delivery.aggregate([
    { $match: { chunkId: chunk._id } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const statusCounts = stats.reduce(
    (acc, s) => ({ ...acc, [s._id]: s.count }),
    {}
  );
  statusCounts.total = stats.reduce((sum, s) => sum + s.count, 0);

  res.json({ success: true, data: { ...chunk, stats: statusCounts } });
});

const updateChunk = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid chunk id" });
  }
  const allowed = ["chunkName", "broadcastName", "templateName", "notes"];
  const update = {};
  allowed.forEach((key) => {
    if (typeof req.body[key] === "string") update[key] = req.body[key].trim();
  });

  const chunk = await Chunk.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
  if (!chunk) return res.status(404).json({ success: false, message: "Chunk not found" });

  const propagate = {};
  if (update.chunkName) propagate.chunkName = update.chunkName;
  if (update.broadcastName) propagate.broadcastName = update.broadcastName;
  if (update.templateName) propagate.templateName = update.templateName;
  if (Object.keys(propagate).length) {
    await Delivery.updateMany({ chunkId: chunk._id }, { $set: propagate });
  }

  res.json({ success: true, data: chunk });
});

const deleteChunk = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid chunk id" });
  }
  const chunk = await Chunk.findByIdAndDelete(req.params.id);
  if (!chunk) return res.status(404).json({ success: false, message: "Chunk not found" });
  const result = await Delivery.deleteMany({ chunkId: chunk._id });
  res.json({ success: true, data: { deletedRecords: result.deletedCount } });
});

const preview = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
  const result = previewFile(req.file.buffer, req.file.originalname);
  const existing = await findDuplicateFile(result.fileHash);

  res.json({
    success: true,
    data: {
      fileName: req.file.originalname,
      fileType: req.file.originalname.split(".").pop().toLowerCase(),
      fileSize: req.file.size,
      ...result,
      duplicateOf: existing
        ? {
            _id: existing._id,
            chunkName: existing.chunkName,
            chunkCode: existing.chunkCode,
            uploadDate: existing.uploadDate,
          }
        : null,
    },
  });
});

const importChunk = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

  let mapping = {};
  if (req.body.mapping) {
    try {
      mapping = JSON.parse(req.body.mapping);
    } catch (e) {
      return res.status(400).json({ success: false, message: "Invalid column mapping payload" });
    }
  }

  const force = req.body.force === "true" || req.body.force === true;
  const { hashBuffer } = require("../services/importService");
  const fileHash = hashBuffer(req.file.buffer);
  const existing = await findDuplicateFile(fileHash);

  if (existing && !force) {
    return res.status(409).json({
      success: false,
      code: "DUPLICATE_FILE",
      message: "This report has already been imported.",
      data: {
        chunkName: existing.chunkName,
        chunkCode: existing.chunkCode,
        uploadDate: existing.uploadDate,
      },
    });
  }

  const result = await importFile({
    buffer: req.file.buffer,
    filename: req.file.originalname,
    fileSize: req.file.size,
    mapping,
    meta: {
      chunkName: req.body.chunkName,
      broadcastName: req.body.broadcastName,
      templateName: req.body.templateName,
      notes: req.body.notes,
      reportDate: req.body.reportDate,
    },
  });

  res.status(201).json({ success: true, data: result });
});

module.exports = {
  listChunks,
  getChunk,
  updateChunk,
  deleteChunk,
  preview,
  importChunk,
};

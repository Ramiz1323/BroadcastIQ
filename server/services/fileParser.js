const path = require("path");
const XLSX = require("xlsx");
const { parse: parseCsvSync } = require("csv-parse/sync");

const SUPPORTED = [".csv", ".xlsx", ".xls"];

function extensionOf(filename) {
  return path.extname(String(filename || "")).toLowerCase();
}

function isSupported(filename) {
  return SUPPORTED.includes(extensionOf(filename));
}

function parseCsvBuffer(buffer) {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const records = parseCsvSync(text, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    bom: true,
  });
  const headers = records.length ? Object.keys(records[0]) : [];
  return { headers, rows: records };
}

function parseExcelBuffer(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { headers: [], rows: [] };
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
  const headerRow = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0 })[0] || [];
  const headers = rows.length
    ? Object.keys(rows[0])
    : headerRow.map((h) => String(h));
  return { headers, rows };
}

/**
 * Parses a CSV/XLS/XLSX buffer into { headers, rows }.
 */
function parseFile(buffer, filename) {
  const ext = extensionOf(filename);
  if (!SUPPORTED.includes(ext)) {
    const err = new Error(`File type not supported: ${ext || "unknown"}. Use CSV, XLS or XLSX.`);
    err.statusCode = 400;
    throw err;
  }

  try {
    const result = ext === ".csv" ? parseCsvBuffer(buffer) : parseExcelBuffer(buffer);
    // strip fully-empty rows
    result.rows = result.rows.filter((row) =>
      Object.values(row).some((v) => String(v == null ? "" : v).trim() !== "")
    );
    return result;
  } catch (e) {
    const err = new Error(
      ext === ".csv" ? "Invalid CSV file. Could not parse contents." : "Invalid Excel file."
    );
    err.statusCode = 400;
    throw err;
  }
}

module.exports = { parseFile, isSupported, extensionOf, SUPPORTED };

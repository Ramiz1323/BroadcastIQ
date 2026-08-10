const path = require("path");
const XLSX = require("xlsx");
const { parse: parseCsvSync } = require("csv-parse/sync");

const SUPPORTED = [".csv", ".xlsx"];

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
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { headers: [], rows: [] };
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const headers = rows.length ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

function parseFile(buffer, filename) {
  const ext = extensionOf(filename);
  if (!SUPPORTED.includes(ext)) {
    throw new Error(`Unsupported extension: ${ext}`);
  }
  const result = ext === ".csv" ? parseCsvBuffer(buffer) : parseExcelBuffer(buffer);
  return result;
}

module.exports = { parseFile, isSupported, extensionOf, SUPPORTED };
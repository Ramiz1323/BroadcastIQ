const ExcelJS = require("exceljs");

const EXPORT_COLUMNS = [
  { key: "chunkName", header: "Chunk" },
  { key: "broadcastName", header: "Broadcast Name" },
  { key: "templateName", header: "Template Name" },
  { key: "phoneNumber", header: "Phone Number" },
  { key: "category", header: "Category" },
  { key: "status", header: "Status" },
  { key: "error", header: "Error" },
  { key: "deliveryDate", header: "Delivery Date" },
  { key: "deliveryTime", header: "Delivery Time" },
];

function csvEscape(value) {
  const str = value == null ? "" : String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCsv(records) {
  const lines = [EXPORT_COLUMNS.map((c) => csvEscape(c.header)).join(",")];
  for (const record of records) {
    lines.push(EXPORT_COLUMNS.map((c) => csvEscape(record[c.key])).join(","));
  }
  return lines.join("\r\n");
}

async function toExcel(records, summary, chunks) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Commun Broadcast Monitor";
  wb.created = new Date();

  const sheet = wb.addWorksheet("Filtered Results");
  sheet.columns = EXPORT_COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: Math.max(14, c.header.length + 6),
  }));
  sheet.getRow(1).font = { bold: true, name: "Arial" };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8F0FE" },
  };
  records.forEach((record) => sheet.addRow(record));
  sheet.autoFilter = { from: "A1", to: { row: 1, column: EXPORT_COLUMNS.length } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const summarySheet = wb.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Metric", key: "metric", width: 26 },
    { header: "Count", key: "count", width: 14 },
    { header: "Percentage", key: "pct", width: 14 },
  ];
  summarySheet.getRow(1).font = { bold: true, name: "Arial" };
  const total = summary.total || 0;
  summarySheet.addRow({ metric: "Total Records", count: total, pct: total ? 1 : 0 });
  ["Delivered", "Read", "Sent", "Replied", "Pending", "Failed", "Unknown"].forEach((status) => {
    const count = summary[status] || 0;
    summarySheet.addRow({ metric: status, count, pct: total ? count / total : 0 });
  });
  summarySheet.getColumn("count").numFmt = "#,##0;(#,##0);-";
  summarySheet.getColumn("pct").numFmt = "0.0%";

  if (Array.isArray(chunks) && chunks.length) {
    const chunkSheet = wb.addWorksheet("Chunks");
    chunkSheet.columns = [
      { header: "Chunk Code", key: "chunkCode", width: 20 },
      { header: "Chunk Name", key: "chunkName", width: 30 },
      { header: "Broadcast", key: "broadcastName", width: 24 },
      { header: "Template", key: "templateName", width: 26 },
      { header: "Total Rows", key: "totalRows", width: 14 },
      { header: "Imported", key: "importedRows", width: 14 },
      { header: "Uploaded", key: "uploadDate", width: 22 },
    ];
    chunkSheet.getRow(1).font = { bold: true, name: "Arial" };
    chunks.forEach((c) =>
      chunkSheet.addRow({
        chunkCode: c.chunkCode,
        chunkName: c.chunkName,
        broadcastName: c.broadcastName,
        templateName: c.templateName,
        totalRows: c.totalRows,
        importedRows: c.importedRows,
        uploadDate: c.uploadDate ? new Date(c.uploadDate).toISOString().slice(0, 19).replace("T", " ") : "",
      })
    );
    chunkSheet.getColumn("totalRows").numFmt = "#,##0;(#,##0);-";
    chunkSheet.getColumn("importedRows").numFmt = "#,##0;(#,##0);-";
  }

  return wb.xlsx.writeBuffer();
}

function buildFileName(query, ext) {
  const date = new Date().toISOString().slice(0, 10);
  const parts = ["report", date];
  if (query.statuses) {
    parts.push(String(query.statuses).toLowerCase().replace(/[^a-z0-9]+/g, "_"));
  }
  if (query.chunkIds) parts.push("selected_chunks");
  return `${parts.filter(Boolean).join("_")}.${ext}`;
}

module.exports = { toCsv, toExcel, buildFileName, EXPORT_COLUMNS };

const mongoose = require("mongoose");
const Chunk = require("../models/Chunk");
const Delivery = require("../models/Delivery");
const SavedReport = require("../models/SavedReport");
const { asyncHandler } = require("../middleware/errorHandler");
const { buildDeliveryFilter, toArray } = require("../utils/queryBuilder");
const { toCsv, toExcel, buildFileName } = require("../services/exportService");

const MAX_EXPORT = 200000;

async function collectSummary(filter) {
  const agg = await Delivery.aggregate([
    { $match: filter },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const summary = agg.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});
  summary.total = agg.reduce((sum, s) => sum + s.count, 0);
  return summary;
}

const previewReport = asyncHandler(async (req, res) => {
  const query = { ...req.query, ...req.body };
  const filter = buildDeliveryFilter(query);

  const [summary, sample, chunkIds] = await Promise.all([
    collectSummary(filter),
    Delivery.find(filter).sort({ createdAt: -1 }).limit(20).lean(),
    Delivery.distinct("chunkId", filter),
  ]);

  const selectedChunks = toArray(query.chunkIds).filter((id) => mongoose.isValidObjectId(id));
  const totalInSelectedChunks = selectedChunks.length
    ? await Delivery.countDocuments({
        chunkId: { $in: selectedChunks.map((id) => new mongoose.Types.ObjectId(id)) },
      })
    : await Delivery.estimatedDocumentCount();

  res.json({
    success: true,
    data: {
      selectedChunks: selectedChunks.length || chunkIds.length,
      totalRecords: totalInSelectedChunks,
      filteredRecords: summary.total || 0,
      summary,
      sample,
    },
  });
});

async function fetchAll(filter) {
  return Delivery.find(filter)
    .sort({ createdAt: -1 })
    .limit(MAX_EXPORT)
    .select(
      "chunkName broadcastName templateName phoneNumber category status error deliveryDate deliveryTime"
    )
    .lean();
}

const exportCsv = asyncHandler(async (req, res) => {
  const filter = buildDeliveryFilter(req.query);
  const records = await fetchAll(filter);
  const csv = toCsv(records);
  const filename = buildFileName(req.query, "csv");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send("\uFEFF" + csv);
});

const exportExcel = asyncHandler(async (req, res) => {
  const filter = buildDeliveryFilter(req.query);
  const [records, summary] = await Promise.all([fetchAll(filter), collectSummary(filter)]);

  const chunkIds = toArray(req.query.chunkIds).filter((id) => mongoose.isValidObjectId(id));
  const chunks = chunkIds.length
    ? await Chunk.find({ _id: { $in: chunkIds } }).lean()
    : await Chunk.find().sort({ uploadDate: -1 }).limit(50).lean();

  const buffer = await toExcel(records, summary, chunks);
  const filename = buildFileName(req.query, "xlsx");

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(Buffer.from(buffer));
});

const listReports = asyncHandler(async (req, res) => {
  const reports = await SavedReport.find().sort({ updatedAt: -1 }).lean();
  res.json({ success: true, data: reports });
});

const createReport = asyncHandler(async (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ success: false, message: "Report name is required" });
  }
  const report = await SavedReport.create({
    name: String(req.body.name).trim(),
    description: String(req.body.description || "").trim(),
    filters: req.body.filters || {},
  });
  res.status(201).json({ success: true, data: report });
});

const updateReport = asyncHandler(async (req, res) => {
  const report = await SavedReport.findByIdAndUpdate(
    req.params.id,
    {
      ...(req.body.name ? { name: String(req.body.name).trim() } : {}),
      ...(req.body.description != null ? { description: String(req.body.description) } : {}),
      ...(req.body.filters ? { filters: req.body.filters } : {}),
    },
    { new: true }
  );
  if (!report) return res.status(404).json({ success: false, message: "Report not found" });
  res.json({ success: true, data: report });
});

const deleteReport = asyncHandler(async (req, res) => {
  const report = await SavedReport.findByIdAndDelete(req.params.id);
  if (!report) return res.status(404).json({ success: false, message: "Report not found" });
  res.json({ success: true, data: { deleted: true } });
});

const runReport = asyncHandler(async (req, res) => {
  const report = await SavedReport.findById(req.params.id);
  if (!report) return res.status(404).json({ success: false, message: "Report not found" });

  const filter = buildDeliveryFilter(report.filters || {});
  const summary = await collectSummary(filter);

  report.lastRunAt = new Date();
  report.lastRunCount = summary.total || 0;
  await report.save();

  res.json({ success: true, data: { report, summary, filters: report.filters } });
});

module.exports = {
  previewReport,
  exportCsv,
  exportExcel,
  listReports,
  createReport,
  updateReport,
  deleteReport,
  runReport,
};

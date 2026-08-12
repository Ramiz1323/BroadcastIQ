const Chunk = require("../models/Chunk");
const Delivery = require("../models/Delivery");
const { asyncHandler } = require("../middleware/errorHandler");

function rangeFromPreset(preset, from, to) {
  const now = new Date();
  const start = new Date();
  switch (preset) {
    case "today":
      start.setHours(0, 0, 0, 0);
      return { $gte: start, $lte: now };
    case "yesterday": {
      const s = new Date();
      s.setDate(s.getDate() - 1);
      s.setHours(0, 0, 0, 0);
      const e = new Date(s);
      e.setHours(23, 59, 59, 999);
      return { $gte: s, $lte: e };
    }
    case "7d":
      start.setDate(start.getDate() - 7);
      return { $gte: start, $lte: now };
    case "30d":
      start.setDate(start.getDate() - 30);
      return { $gte: start, $lte: now };
    case "custom": {
      const range = {};
      if (from) {
        const f = new Date(from);
        if (!isNaN(f.getTime())) range.$gte = f;
      }
      if (to) {
        const t = new Date(to);
        if (!isNaN(t.getTime())) {
          t.setHours(23, 59, 59, 999);
          range.$lte = t;
        }
      }
      return Object.keys(range).length ? range : null;
    }
    default:
      return null;
  }
}

const stats = asyncHandler(async (req, res) => {
  const range = rangeFromPreset(req.query.preset, req.query.fromDate, req.query.toDate);
  const filter = range ? { createdAt: range } : {};

  const [statusAgg, totalChunks, totalRecipients] = await Promise.all([
    Delivery.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Chunk.countDocuments(range ? { uploadDate: range } : {}),
    Delivery.countDocuments(filter),
  ]);

  const counts = {
    Delivered: 0,
    Read: 0,
    Sent: 0,
    Replied: 0,
    Pending: 0,
    Failed: 0,
    Unknown: 0,
  };
  statusAgg.forEach((s) => {
    counts[s._id] = s.count;
  });

  const recentChunks = await Chunk.find(range ? { uploadDate: range } : {})
    .sort({ uploadDate: -1 })
    .limit(6)
    .lean();

  res.json({
    success: true,
    data: {
      totalChunks,
      totalRecipients,
      counts,
      recentChunks,
    },
  });
});

const chunkPerformance = asyncHandler(async (req, res) => {
  const limit = Math.min(30, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const rows = await Delivery.aggregate([
    {
      $group: {
        _id: { chunkId: "$chunkId", chunkName: "$chunkName" },
        total: { $sum: 1 },
        delivered: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } },
        read: { $sum: { $cond: [{ $eq: ["$status", "Read"] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ["$status", "Failed"] }, 1, 0] } },
      },
    },
    { $sort: { total: -1 } },
    { $limit: limit },
  ]);

  res.json({
    success: true,
    data: rows.map((r) => ({
      chunkId: r._id.chunkId,
      chunkName: r._id.chunkName || "Unnamed chunk",
      total: r.total,
      delivered: r.delivered,
      read: r.read,
      failed: r.failed,
    })),
  });
});

module.exports = { stats, chunkPerformance };

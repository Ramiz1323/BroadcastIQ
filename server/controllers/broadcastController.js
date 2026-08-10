const Delivery = require("../models/Delivery");
const { asyncHandler } = require("../middleware/errorHandler");
const { safeRegex } = require("../utils/queryBuilder");

const listBroadcasts = asyncHandler(async (req, res) => {
  const match = {};
  if (req.query.search) match.broadcastName = safeRegex(req.query.search);

  const rows = await Delivery.aggregate([
    { $match: { broadcastName: { $ne: "" }, ...match } },
    {
      $group: {
        _id: "$broadcastName",
        total: { $sum: 1 },
        templates: { $addToSet: "$templateName" },
        chunks: { $addToSet: "$chunkName" },
        lastDate: { $max: "$deliveryDateTime" },
        uploadedAt: { $max: "$createdAt" },
        delivered: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } },
        read: { $sum: { $cond: [{ $eq: ["$status", "Read"] }, 1, 0] } },
        sent: { $sum: { $cond: [{ $eq: ["$status", "Sent"] }, 1, 0] } },
        replied: { $sum: { $cond: [{ $eq: ["$status", "Replied"] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ["$status", "Failed"] }, 1, 0] } },
      },
    },
    { $sort: { uploadedAt: -1 } },
  ]);

  res.json({
    success: true,
    data: rows.map((r) => ({
      broadcastName: r._id,
      total: r.total,
      templateName: (r.templates.filter(Boolean)[0] || ""),
      templates: r.templates.filter(Boolean),
      chunks: r.chunks.filter(Boolean),
      date: r.lastDate || r.uploadedAt,
      uploadedAt: r.uploadedAt,
      counts: {
        Delivered: r.delivered,
        Read: r.read,
        Sent: r.sent,
        Replied: r.replied,
        Pending: r.pending,
        Failed: r.failed,
      },
    })),
  });
});

const getBroadcast = asyncHandler(async (req, res) => {
  const broadcastName = decodeURIComponent(req.params.name);

  const [counts, meta] = await Promise.all([
    Delivery.aggregate([
      { $match: { broadcastName } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Delivery.aggregate([
      { $match: { broadcastName } },
      {
        $group: {
          _id: null,
          templates: { $addToSet: "$templateName" },
          chunks: { $addToSet: { chunkId: "$chunkId", chunkName: "$chunkName" } },
          categories: { $addToSet: "$category" },
          firstDate: { $min: "$deliveryDateTime" },
          lastDate: { $max: "$deliveryDateTime" },
          total: { $sum: 1 },
        },
      },
    ]),
  ]);

  if (!meta.length) {
    return res.status(404).json({ success: false, message: "Broadcast not found" });
  }

  const info = meta[0];
  const total = info.total || 0;
  const results = counts.map((c) => ({
    status: c._id,
    count: c.count,
    percentage: total ? (c.count / total) * 100 : 0,
  }));

  res.json({
    success: true,
    data: {
      broadcastName,
      total,
      templateName: info.templates.filter(Boolean)[0] || "",
      templates: info.templates.filter(Boolean),
      chunks: info.chunks,
      categories: info.categories.filter(Boolean),
      scheduledAt: info.firstDate,
      lastActivityAt: info.lastDate,
      results,
    },
  });
});

module.exports = { listBroadcasts, getBroadcast };

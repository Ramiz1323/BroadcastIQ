const Delivery = require("../models/Delivery");
const { asyncHandler } = require("../middleware/errorHandler");
const { buildDeliveryFilter, parsePagination, parseSort } = require("../utils/queryBuilder");

const listDeliveries = asyncHandler(async (req, res) => {
  const filter = buildDeliveryFilter(req.query);
  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort(req.query);

  const [records, total, statusAgg] = await Promise.all([
    Delivery.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Delivery.countDocuments(filter),
    Delivery.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const summary = statusAgg.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});
  summary.total = total;

  res.json({
    success: true,
    data: records,
    summary,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

const getDelivery = asyncHandler(async (req, res) => {
  const record = await Delivery.findById(req.params.id).lean();
  if (!record) return res.status(404).json({ success: false, message: "Record not found" });
  res.json({ success: true, data: record });
});

const facets = asyncHandler(async (req, res) => {
  const [broadcasts, templates, categories] = await Promise.all([
    Delivery.distinct("broadcastName"),
    Delivery.distinct("templateName"),
    Delivery.distinct("category"),
  ]);
  res.json({
    success: true,
    data: {
      broadcastNames: broadcasts.filter(Boolean).sort(),
      templateNames: templates.filter(Boolean).sort(),
      categories: categories.filter(Boolean).sort(),
      statuses: ["Delivered", "Sent", "Read", "Replied", "Pending", "Failed", "Unknown"],
    },
  });
});

module.exports = { listDeliveries, getDelivery, facets };

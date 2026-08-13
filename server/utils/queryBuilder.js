const mongoose = require("mongoose");
const { STATUSES } = require("../models/Delivery");

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeRegex(value) {
  return new RegExp(escapeRegex(String(value).slice(0, 120)), "i");
}

function parseDateInput(value, endOfDay) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  if (endOfDay) d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Builds a safe MongoDB filter for the Delivery collection from query params.
 */
function buildDeliveryFilter(query = {}) {
  const filter = {};

  const chunkIds = toArray(query.chunkIds).filter((id) => mongoose.isValidObjectId(id));
  if (chunkIds.length) {
    filter.chunkId = { $in: chunkIds.map((id) => new mongoose.Types.ObjectId(id)) };
  }

  const broadcastNames = toArray(query.broadcastNames);
  if (broadcastNames.length) filter.broadcastName = { $in: broadcastNames };

  const templateNames = toArray(query.templateNames);
  if (templateNames.length) filter.templateName = { $in: templateNames };

  const statuses = toArray(query.statuses).filter((s) => STATUSES.includes(s));
  if (statuses.length) filter.status = { $in: statuses };

  const categories = toArray(query.categories);
  if (categories.length) filter.category = { $in: categories };

  // Exact delivery-date match (single day)
  const exactDay = parseDateInput(query.deliveryDate, false);
  if (exactDay) {
    const start = new Date(exactDay);
    start.setHours(0, 0, 0, 0);
    const end = new Date(exactDay);
    end.setHours(23, 59, 59, 999);
    filter.deliveryDateTime = { $gte: start, $lte: end };
  }

  const from = parseDateInput(query.fromDate, false);
  const to = parseDateInput(query.toDate, true);
  if (from || to) {
    filter.deliveryDateTime = filter.deliveryDateTime || {};
    if (from) filter.deliveryDateTime.$gte = from;
    if (to) filter.deliveryDateTime.$lte = to;
  }

  const upFrom = parseDateInput(query.uploadedFrom, false);
  const upTo = parseDateInput(query.uploadedTo, true);
  if (upFrom || upTo) {
    filter.createdAt = {};
    if (upFrom) filter.createdAt.$gte = upFrom;
    if (upTo) filter.createdAt.$lte = upTo;
  }

  if (query.phone) {
    const digits = String(query.phone).replace(/\D/g, "").slice(0, 20);
    if (digits) {
      filter.$or = [
        { phoneNumber: safeRegex(digits) },
        { originalPhoneNumber: safeRegex(digits) },
        { sentTo: safeRegex(digits) },
      ];
    }
  }

  if (query.error) {
    filter.error = safeRegex(query.error);
  }

  if (query.search) {
    const rx = safeRegex(query.search);
    const searchOr = [
      { phoneNumber: rx },
      { originalPhoneNumber: rx },
      { sentTo: rx },
      { broadcastName: rx },
      { templateName: rx },
      { chunkName: rx },
      { error: rx },
      { status: rx },
      { category: rx },
    ];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
      delete filter.$or;
    } else {
      filter.$or = searchOr;
    }
  }

  return filter;
}

function parsePagination(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(query.limit, 10) || 50));
  return { page, limit, skip: (page - 1) * limit };
}

function parseSort(query = {}) {
  const allowed = [
    "createdAt",
    "deliveryDateTime",
    "phoneNumber",
    "status",
    "broadcastName",
    "templateName",
    "chunkName",
  ];
  const field = allowed.includes(query.sortBy) ? query.sortBy : "createdAt";
  const dir = query.sortDir === "asc" ? 1 : -1;
  return { [field]: dir };
}

module.exports = { buildDeliveryFilter, parsePagination, parseSort, toArray, safeRegex };

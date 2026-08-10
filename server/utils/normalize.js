const crypto = require("crypto");
const { normalizePhone, isValidPhone } = require("./phone");

const STATUS_MAP = {
  delivered: "Delivered",
  delivery: "Delivered",
  sent: "Sent",
  send: "Sent",
  read: "Read",
  seen: "Read",
  replied: "Replied",
  reply: "Replied",
  responded: "Replied",
  pending: "Pending",
  queued: "Pending",
  queue: "Pending",
  processing: "Pending",
  scheduled: "Pending",
  failed: "Failed",
  failure: "Failed",
  error: "Failed",
  undelivered: "Failed",
  rejected: "Failed",
};

function normalizeStatus(raw) {
  const key = String(raw == null ? "" : raw).trim().toLowerCase();
  if (!key) return "Unknown";
  if (STATUS_MAP[key]) return STATUS_MAP[key];
  const hit = Object.keys(STATUS_MAP).find((k) => key.includes(k));
  return hit ? STATUS_MAP[hit] : "Unknown";
}

function parseDateTime(raw) {
  if (raw == null || raw === "") return null;
  if (raw instanceof Date && !isNaN(raw.getTime())) return raw;

  const value = String(raw).trim();

  // Excel serial number
  if (/^\d{5}(\.\d+)?$/.test(value)) {
    const serial = Number(value);
    const ms = Math.round((serial - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d;
  }

  // dd/mm/yyyy or dd-mm-yyyy [hh:mm[:ss]] [AM/PM]
  const m = value.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?)?$/
  );
  if (m) {
    let [, d1, d2, y, hh, mm, ss, ap] = m;
    let day = Number(d1);
    let month = Number(d2);
    if (month > 12 && day <= 12) {
      const t = day;
      day = month;
      month = t;
    }
    let year = Number(y);
    if (year < 100) year += 2000;
    let hours = hh ? Number(hh) : 0;
    if (ap && /pm/i.test(ap) && hours < 12) hours += 12;
    if (ap && /am/i.test(ap) && hours === 12) hours = 0;
    const dt = new Date(year, month - 1, day, hours, mm ? Number(mm) : 0, ss ? Number(ss) : 0);
    if (!isNaN(dt.getTime())) return dt;
  }

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDatePart(date) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function formatTimePart(date) {
  if (!date) return "";
  return date.toTimeString().slice(0, 8);
}

function fingerprint(parts) {
  return crypto.createHash("sha1").update(parts.join("||")).digest("hex");
}

/**
 * Normalize a single raw row using a column mapping.
 * Returns { valid, reason, record }
 */
function normalizeRow(row, mapping, context) {
  const pick = (field) => {
    const header = mapping[field];
    if (!header) return "";
    const value = row[header];
    return value == null ? "" : value;
  };

  const rawPhone = pick("phoneNumber");
  const { phoneNumber, originalPhoneNumber, countryCode } = normalizePhone(rawPhone);

  const dt = parseDateTime(pick("deliveryDateTime"));
  const status = normalizeStatus(pick("status"));

  const record = {
    chunkId: context.chunkId,
    chunkName: context.chunkName,
    chunkCode: context.chunkCode,
    broadcastName: String(pick("broadcastName") || context.broadcastName || "").trim(),
    templateName: String(pick("templateName") || context.templateName || "").trim(),
    sentTo: String(rawPhone || "").trim(),
    phoneNumber,
    originalPhoneNumber,
    countryCode,
    category: String(pick("category") || "NA").trim() || "NA",
    error: String(pick("error") || "").trim(),
    status,
    deliveryDate: formatDatePart(dt),
    deliveryTime: formatTimePart(dt),
    deliveryDateTime: dt,
    originalRow: row,
  };

  record.rowFingerprint = fingerprint([
    String(context.chunkCode || ""),
    record.phoneNumber,
    record.broadcastName,
    record.templateName,
    dt ? dt.toISOString() : "",
    record.status,
  ]);

  if (!isValidPhone(phoneNumber)) {
    return { valid: false, reason: "Invalid or missing phone number", record };
  }

  return { valid: true, reason: "", record };
}

module.exports = {
  normalizeRow,
  normalizeStatus,
  parseDateTime,
  fingerprint,
  formatDatePart,
  formatTimePart,
};

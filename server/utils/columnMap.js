// Flexible column mapping: maps arbitrary Commun export headers to internal fields.

const SYSTEM_FIELDS = [
  { key: "templateName", label: "Template Name" },
  { key: "phoneNumber", label: "Phone Number" },
  { key: "category", label: "Category" },
  { key: "error", label: "Error" },
  { key: "status", label: "Status" },
  { key: "deliveryDateTime", label: "Delivery Date" },
  { key: "broadcastName", label: "Broadcast Name" },
  { key: "name", label: "Recipient Name" },
];

const ALIASES = {
  templateName: ["template name", "template", "templatename", "message template", "msg template"],
  phoneNumber: [
    "sent to",
    "sent_to",
    "sentto",
    "phone",
    "phone number",
    "phonenumber",
    "phone_no",
    "mobile",
    "mobile number",
    "whatsapp number",
    "number",
    "msisdn",
    "contact",
    "recipient",
    "to",
  ],
  category: ["category", "type", "message category"],
  error: ["error", "error message", "failure reason", "reason", "remarks"],
  status: ["status", "delivery status", "message status", "state"],
  deliveryDateTime: [
    "delivery",
    "delivery date",
    "delivery time",
    "delivered at",
    "date",
    "datetime",
    "date time",
    "timestamp",
    "sent at",
  ],
  broadcastName: ["broadcast", "broadcast name", "campaign", "campaign name"],
  name: ["name", "full name", "contact name", "recipient name"],
};

function canon(header) {
  return String(header == null ? "" : header)
    .replace(/[_\-.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Returns { templateName: "Template Name", phoneNumber: "Sent to", ... }
function autoDetectMapping(headers) {
  const mapping = {};
  const used = new Set();

  for (const field of Object.keys(ALIASES)) {
    const aliases = ALIASES[field];
    // exact match first
    let match = headers.find((h) => !used.has(h) && aliases.includes(canon(h)));
    if (!match) {
      match = headers.find(
        (h) => !used.has(h) && aliases.some((a) => canon(h).includes(a) || a.includes(canon(h)))
      );
    }
    if (match) {
      mapping[field] = match;
      used.add(match);
    }
  }

  return mapping;
}

module.exports = { SYSTEM_FIELDS, ALIASES, autoDetectMapping, canon };

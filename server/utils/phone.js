// Phone normalization: keeps original, produces a comparable normalized value.
// Indian numbers are reduced to the last 10 digits (91 prefix stripped).

function digitsOnly(value) {
  return String(value == null ? "" : value).replace(/\D/g, "");
}

function normalizePhone(raw) {
  const original = String(raw == null ? "" : raw).trim();
  let digits = digitsOnly(original);

  if (!digits) {
    return { phoneNumber: "", originalPhoneNumber: original, countryCode: "" };
  }

  // Strip international access prefixes
  if (digits.startsWith("00")) digits = digits.slice(2);

  let countryCode = "";

  // Indian handling: 91XXXXXXXXXX (12) or 0XXXXXXXXXX (11) or XXXXXXXXXX (10)
  if (digits.length === 12 && digits.startsWith("91")) {
    countryCode = "91";
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  } else if (digits.length === 13 && digits.startsWith("910")) {
    countryCode = "91";
    digits = digits.slice(3);
  }

  // Indian mobile numbers start with 6-9 and are 10 digits.
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    countryCode = countryCode || "91";
    return { phoneNumber: digits, originalPhoneNumber: original, countryCode };
  }

  // Non-Indian / unknown: keep full digit string (E.164-ish without +).
  return { phoneNumber: digits, originalPhoneNumber: original, countryCode };
}

function isValidPhone(normalized) {
  return typeof normalized === "string" && normalized.length >= 7 && normalized.length <= 15;
}

module.exports = { normalizePhone, isValidPhone, digitsOnly };

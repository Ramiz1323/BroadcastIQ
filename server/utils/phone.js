function digitsOnly(value) {
  return String(value == null ? "" : value).replace(/\D/g, "");
}

function normalizePhone(raw) {
  const original = String(raw == null ? "" : raw).trim();
  let digits = digitsOnly(original);

  if (!digits) {
    return { phoneNumber: "", originalPhoneNumber: original, countryCode: "" };
  }

  if (digits.startsWith("00")) digits = digits.slice(2);

  let countryCode = "";

  if (digits.length === 12 && digits.startsWith("91")) {
    countryCode = "91";
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    countryCode = countryCode || "91";
    return { phoneNumber: digits, originalPhoneNumber: original, countryCode };
  }

  return { phoneNumber: digits, originalPhoneNumber: original, countryCode };
}

function isValidPhone(normalized) {
  return typeof normalized === "string" && normalized.length >= 7 && normalized.length <= 15;
}

module.exports = { normalizePhone, isValidPhone, digitsOnly };
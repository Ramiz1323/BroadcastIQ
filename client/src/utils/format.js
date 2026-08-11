export const STATUS_COLORS = {
  Delivered: "#16a34a",
  Read: "#2563eb",
  Sent: "#0ea5e9",
  Replied: "#8b5cf6",
  Pending: "#f59e0b",
  Failed: "#dc2626",
  Unknown: "#94a3b8",
};

export const ALL_STATUSES = [
  "Delivered",
  "Sent",
  "Read",
  "Replied",
  "Pending",
  "Failed",
  "Unknown",
];

export function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return `${formatDate(d)} ${d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function percentage(part, total) {
  if (!total) return "0.00%";
  return `${((part / total) * 100).toFixed(2)}%`;
}

import { STATUS_COLORS } from "../utils/format.js";

const CLASSES = {
  Delivered: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  Read: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Sent: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  Replied: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Failed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  Unknown: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        CLASSES[status] || CLASSES.Unknown
      }`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: STATUS_COLORS[status] || STATUS_COLORS.Unknown }}
      />
      {status || "Unknown"}
    </span>
  );
}

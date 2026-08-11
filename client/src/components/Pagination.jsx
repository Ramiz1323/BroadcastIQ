import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "../utils/format.js";

export default function Pagination({ pagination, onChange, onLimitChange }) {
  if (!pagination) return null;
  const { page, pages, total, limit } = pagination;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800 sm:flex-row">
      <p className="text-slate-500 dark:text-slate-400">
        Showing {formatNumber(total)} record{total === 1 ? "" : "s"} · page {page} of {pages}
      </p>
      <div className="flex items-center gap-2">
        <select
          className="input w-auto py-1.5"
          value={limit}
          onChange={(e) => onLimitChange && onLimitChange(Number(e.target.value))}
        >
          {[25, 50, 100, 200].map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
        <button
          className="btn-ghost px-2 py-1.5"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          className="btn-ghost px-2 py-1.5"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

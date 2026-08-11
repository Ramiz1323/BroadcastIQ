import { formatNumber } from "../utils/format.js";

export default function StatCard({ label, value, icon: Icon, accent = "brand", hint }) {
  const accents = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-700/20 dark:text-brand-200",
    green: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
    red: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300",
  };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {formatNumber(value)}
          </p>
          {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
        </div>
        {Icon ? (
          <span className={`rounded-lg p-2 ${accents[accent] || accents.brand}`}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

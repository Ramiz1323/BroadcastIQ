export function SkeletonRows({ rows = 6, cols = 6 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t border-slate-100 dark:border-slate-800">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-4 py-3">
              <div className="h-3.5 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card h-24 animate-pulse bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  );
}

export function SkeletonBlock({ className = "h-64" }) {
  return <div className={`card animate-pulse bg-slate-100 dark:bg-slate-800 ${className}`} />;
}

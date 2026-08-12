import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Radio } from "lucide-react";
import EmptyState from "../components/EmptyState.jsx";
import { SkeletonRows } from "../components/Skeleton.jsx";
import { useToast } from "../components/Toast.jsx";
import useDebounce from "../hooks/useDebounce.js";
import { listBroadcasts } from "../services/api.js";
import { formatDate, formatNumber } from "../utils/format.js";

export default function Broadcasts() {
  const { push } = useToast();
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listBroadcasts({ search: debounced })
      .then((res) => alive && setRows(res.data))
      .catch((err) => push(err.friendlyMessage || "Failed to load broadcasts", "error"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [debounced, push]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Broadcast Report</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            All campaigns detected across imported chunks.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search broadcasts"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-wrap">
          <table className="min-w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="th">Broadcast Name</th>
                <th className="th">Message Template</th>
                <th className="th">Total</th>
                <th className="th">Delivered</th>
                <th className="th">Failed</th>
                <th className="th">Date</th>
                <th className="th">Action</th>
              </tr>
            </thead>
            {loading ? (
              <SkeletonRows rows={6} cols={7} />
            ) : (
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.broadcastName}
                    className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <td className="td font-medium">{row.broadcastName}</td>
                    <td className="td">{row.templateName || "—"}</td>
                    <td className="td">{formatNumber(row.total)}</td>
                    <td className="td text-green-600">{formatNumber(row.counts.Delivered)}</td>
                    <td className="td text-red-600">{formatNumber(row.counts.Failed)}</td>
                    <td className="td">{formatDate(row.date)}</td>
                    <td className="td">
                      <Link
                        to={`/broadcasts/${encodeURIComponent(row.broadcastName)}`}
                        className="text-xs font-semibold text-brand-600 hover:underline"
                      >
                        View report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        {!loading && rows.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="No broadcasts yet"
            description="Broadcast names are detected from imported Commun reports."
          />
        ) : null}
      </div>
    </div>
  );
}

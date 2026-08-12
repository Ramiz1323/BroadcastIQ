import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Boxes,
  Users,
  CheckCircle2,
  BookOpen,
  Send,
  XCircle,
  Clock,
  MessageSquare,
  Upload,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import StatCard from "../components/StatCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { SkeletonCards, SkeletonBlock } from "../components/Skeleton.jsx";
import { useToast } from "../components/Toast.jsx";
import { dashboardStats, chunkPerformance } from "../services/api.js";
import { STATUS_COLORS, formatDate, formatNumber } from "../utils/format.js";

const PRESETS = [
  { key: "all", label: "All Time" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "custom", label: "Custom Range" },
];

export default function Dashboard() {
  const { push } = useToast();
  const [preset, setPreset] = useState("all");
  const [range, setRange] = useState({ fromDate: "", toDate: "" });
  const [stats, setStats] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      dashboardStats({ preset, ...(preset === "custom" ? range : {}) }),
      chunkPerformance(),
    ])
      .then(([s, p]) => {
        if (!alive) return;
        setStats(s.data);
        setPerformance(p.data);
      })
      .catch((err) => push(err.friendlyMessage || "Failed to load dashboard", "error"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [preset, range, push]);

  const counts = stats?.counts || {};
  const pieData = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Campaign performance across all imported chunks.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                preset === p.key
                  ? "bg-brand-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {preset === "custom" ? (
        <div className="card flex flex-wrap items-end gap-3 p-4">
          <div>
            <span className="label">From</span>
            <input
              type="date"
              className="input"
              value={range.fromDate}
              onChange={(e) => setRange((r) => ({ ...r, fromDate: e.target.value }))}
            />
          </div>
          <div>
            <span className="label">To</span>
            <input
              type="date"
              className="input"
              value={range.toDate}
              onChange={(e) => setRange((r) => ({ ...r, toDate: e.target.value }))}
            />
          </div>
        </div>
      ) : null}

      {loading ? (
        <SkeletonCards count={8} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Chunks" value={stats?.totalChunks} icon={Boxes} accent="brand" />
          <StatCard label="Total Recipients" value={stats?.totalRecipients} icon={Users} accent="brand" />
          <StatCard label="Delivered" value={counts.Delivered} icon={CheckCircle2} accent="green" />
          <StatCard label="Read" value={counts.Read} icon={BookOpen} accent="blue" />
          <StatCard label="Sent" value={counts.Sent} icon={Send} accent="sky" />
          <StatCard label="Failed" value={counts.Failed} icon={XCircle} accent="red" />
          <StatCard label="Pending" value={counts.Pending} icon={Clock} accent="amber" />
          <StatCard label="Replied" value={counts.Replied} icon={MessageSquare} accent="violet" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {loading ? (
          <SkeletonBlock className="h-80" />
        ) : (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Delivery Status
            </h3>
            {pieData.length === 0 ? (
              <EmptyState title="No delivery data yet" description="Import a report to see stats." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatNumber(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <SkeletonBlock className="h-80" />
        ) : (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Chunk Performance
            </h3>
            {performance.length === 0 ? (
              <EmptyState title="No chunks yet" description="Upload your first Commun report." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performance} margin={{ top: 16, right: 8, bottom: 8, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="chunkName" tick={{ fontSize: 10 }} interval={0} angle={-15} height={50} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="delivered" name="Delivered" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="failed" name="Failed" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent Imports</h3>
          <Link to="/chunks" className="text-xs font-medium text-brand-600 hover:underline">
            View all chunks
          </Link>
        </div>
        {!loading && (!stats?.recentChunks || stats.recentChunks.length === 0) ? (
          <EmptyState
            title="No reports imported yet."
            description="Upload your first Commun CSV or Excel report to start monitoring your campaigns."
            action={
              <Link to="/import" className="btn-primary">
                <Upload className="h-4 w-4" />
                Import Report
              </Link>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="min-w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="th">Chunk</th>
                  <th className="th">Broadcast</th>
                  <th className="th">Rows</th>
                  <th className="th">Status</th>
                  <th className="th">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentChunks || []).map((chunk) => (
                  <tr key={chunk._id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="td font-medium">{chunk.chunkName}</td>
                    <td className="td">{chunk.broadcastName || "—"}</td>
                    <td className="td">{formatNumber(chunk.importedRows)}</td>
                    <td className="td">{chunk.status}</td>
                    <td className="td">{formatDate(chunk.uploadDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

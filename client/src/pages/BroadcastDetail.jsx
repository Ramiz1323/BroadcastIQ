import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import StatusBadge from "../components/StatusBadge.jsx";
import DeliveryTable from "../components/DeliveryTable.jsx";
import { SkeletonBlock } from "../components/Skeleton.jsx";
import { useToast } from "../components/Toast.jsx";
import { getBroadcast, listDeliveries, exportUrl } from "../services/api.js";
import { STATUS_COLORS, formatDateTime, formatNumber, percentage } from "../utils/format.js";

export default function BroadcastDetail() {
  const { name } = useParams();
  const broadcastName = decodeURIComponent(name);
  const { push } = useToast();

  const [tab, setTab] = useState("results");
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [tableLoading, setTableLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getBroadcast(broadcastName)
      .then((res) => alive && setInfo(res.data))
      .catch((err) => push(err.friendlyMessage || "Failed to load broadcast", "error"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [broadcastName, push]);

  useEffect(() => {
    if (tab !== "details") return undefined;
    let alive = true;
    setTableLoading(true);
    listDeliveries({ broadcastNames: [broadcastName], page, limit })
      .then((res) => {
        if (!alive) return;
        setRecords(res.data);
        setPagination(res.pagination);
      })
      .catch((err) => push(err.friendlyMessage || "Failed to load recipients", "error"))
      .finally(() => alive && setTableLoading(false));
    return () => {
      alive = false;
    };
  }, [tab, broadcastName, page, limit, push]);

  const pieData = useMemo(
    () => (info?.results || []).filter((r) => r.count > 0).map((r) => ({ name: r.status, value: r.count })),
    [info]
  );

  if (loading) return <SkeletonBlock className="h-96" />;
  if (!info) return null;

  return (
    <div className="space-y-5">
      <Link to="/broadcasts" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Back to broadcasts
      </Link>

      <div className="card p-5">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{info.broadcastName}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
          <div>
            <dt className="label">Total Recipients</dt>
            <dd className="font-semibold">{formatNumber(info.total)}</dd>
          </div>
          <div>
            <dt className="label">Template Used</dt>
            <dd className="font-semibold">{info.templateName || "—"}</dd>
          </div>
          <div>
            <dt className="label">Recipient Segment</dt>
            <dd className="font-semibold">{info.chunks.length} chunk(s)</dd>
          </div>
          <div>
            <dt className="label">Broadcast Type</dt>
            <dd className="font-semibold">Scheduled</dd>
          </div>
          <div>
            <dt className="label">Scheduled Date &amp; Time</dt>
            <dd className="font-semibold">{formatDateTime(info.scheduledAt)}</dd>
          </div>
          <div>
            <dt className="label">Last Activity</dt>
            <dd className="font-semibold">{formatDateTime(info.lastActivityAt)}</dd>
          </div>
          <div>
            <dt className="label">Retry on Failure</dt>
            <dd className="font-semibold">No</dd>
          </div>
          <div>
            <dt className="label">Categories</dt>
            <dd className="font-semibold">{info.categories.join(", ") || "NA"}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className={tab === "results" ? "btn-primary" : "btn-ghost"}
          onClick={() => setTab("results")}
        >
          Broadcast Results
        </button>
        <button
          className={tab === "details" ? "btn-primary" : "btn-ghost"}
          onClick={() => setTab("details")}
        >
          Delivery Details
        </button>
        <a
          className="btn-ghost ml-auto"
          href={exportUrl("csv", { broadcastNames: [broadcastName] })}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
        <a
          className="btn-ghost"
          href={exportUrl("excel", { broadcastNames: [broadcastName] })}
        >
          <Download className="h-4 w-4" />
          Export Excel
        </a>
      </div>

      {tab === "results" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card overflow-hidden">
            <div className="table-wrap">
              <table className="min-w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/60">
                  <tr>
                    <th className="th">Status</th>
                    <th className="th">Count</th>
                    <th className="th">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {info.results.map((row) => (
                    <tr key={row.status} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="td">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="td">{formatNumber(row.count)}</td>
                      <td className="td">{percentage(row.count, info.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-5">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatNumber(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <DeliveryTable
          records={records}
          loading={tableLoading}
          pagination={pagination}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}

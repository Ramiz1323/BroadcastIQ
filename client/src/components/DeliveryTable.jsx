import StatusBadge from "./StatusBadge.jsx";
import EmptyState from "./EmptyState.jsx";
import Pagination from "./Pagination.jsx";
import { SkeletonRows } from "./Skeleton.jsx";
import { formatDateTime } from "../utils/format.js";

export default function DeliveryTable({
  records,
  loading,
  pagination,
  onPageChange,
  onLimitChange,
}) {
  return (
    <div className="card overflow-hidden">
      <div className="table-wrap">
        <table className="min-w-full">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              <th className="th">Template Name</th>
              <th className="th">Sent To</th>
              <th className="th">Category</th>
              <th className="th">Error</th>
              <th className="th">Status</th>
              <th className="th">Delivery</th>
              <th className="th">Chunk</th>
              <th className="th">Broadcast</th>
            </tr>
          </thead>
          {loading ? (
            <SkeletonRows rows={8} cols={8} />
          ) : (
            <tbody>
              {records.map((record) => (
                <tr
                  key={record._id}
                  className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                >
                  <td className="td font-medium">{record.templateName || "—"}</td>
                  <td className="td">
                    {record.originalPhoneNumber || record.sentTo || record.phoneNumber}
                  </td>
                  <td className="td">{record.category || "NA"}</td>
                  <td className="td max-w-xs truncate whitespace-normal text-slate-500">
                    {record.error || "NA"}
                  </td>
                  <td className="td">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="td">{formatDateTime(record.deliveryDateTime)}</td>
                  <td className="td">{record.chunkName || "—"}</td>
                  <td className="td">{record.broadcastName || "—"}</td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {!loading && records.length === 0 ? (
        <EmptyState
          title="No records found"
          description="Try widening your filters, or import a new Commun report."
        />
      ) : null}

      <Pagination
        pagination={pagination}
        onChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Pencil, Trash2, Download, Eye, Boxes, Upload } from "lucide-react";
import EmptyState from "../components/EmptyState.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Pagination from "../components/Pagination.jsx";
import { SkeletonRows } from "../components/Skeleton.jsx";
import { useToast } from "../components/Toast.jsx";
import useDebounce from "../hooks/useDebounce.js";
import { listChunks, deleteChunk, updateChunk, exportUrl } from "../services/api.js";
import { formatDate, formatNumber } from "../utils/format.js";

export default function Chunks() {
  const { push } = useToast();
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    listChunks({ search: debounced, page, limit })
      .then((res) => {
        setRows(res.data);
        setPagination(res.pagination);
      })
      .catch((err) => push(err.friendlyMessage || "Failed to load chunks", "error"))
      .finally(() => setLoading(false));
  }, [debounced, page, limit, push]);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async () => {
    try {
      const res = await deleteChunk(confirm._id);
      push(`Chunk deleted (${formatNumber(res.data.deletedRecords)} records removed)`, "success");
      setConfirm(null);
      load();
    } catch (err) {
      push(err.friendlyMessage || "Failed to delete chunk", "error");
    }
  };

  const onSaveEdit = async () => {
    try {
      await updateChunk(editing._id, {
        chunkName: editing.chunkName,
        broadcastName: editing.broadcastName,
        templateName: editing.templateName,
        notes: editing.notes,
      });
      push("Chunk updated", "success");
      setEditing(null);
      load();
    } catch (err) {
      push(err.friendlyMessage || "Failed to update chunk", "error");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Chunks</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Each upload is stored as an immutable chunk of delivery records.
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search chunks"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Link to="/import" className="btn-primary">
            <Upload className="h-4 w-4" />
            Import
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-wrap">
          <table className="min-w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="th">Chunk</th>
                <th className="th">Broadcast</th>
                <th className="th">Template</th>
                <th className="th">Total</th>
                <th className="th">Delivered</th>
                <th className="th">Read</th>
                <th className="th">Failed</th>
                <th className="th">Uploaded</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            {loading ? (
              <SkeletonRows rows={6} cols={9} />
            ) : (
              <tbody>
                {rows.map((chunk) => (
                  <tr
                    key={chunk._id}
                    className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <td className="td">
                      <div className="font-medium">{chunk.chunkName}</div>
                      <div className="text-xs text-slate-400">{chunk.chunkCode}</div>
                    </td>
                    <td className="td">{chunk.broadcastName || "—"}</td>
                    <td className="td">{chunk.templateName || "—"}</td>
                    <td className="td">{formatNumber(chunk.stats.total)}</td>
                    <td className="td text-green-600">{formatNumber(chunk.stats.Delivered || 0)}</td>
                    <td className="td text-blue-600">{formatNumber(chunk.stats.Read || 0)}</td>
                    <td className="td text-red-600">{formatNumber(chunk.stats.Failed || 0)}</td>
                    <td className="td">{formatDate(chunk.uploadDate)}</td>
                    <td className="td">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/recipients?chunkIds=${chunk._id}`}
                          className="rounded p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View recipients"
                        >
                          <Eye className="h-4 w-4 text-slate-500" />
                        </Link>
                        <button
                          className="rounded p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit"
                          onClick={() => setEditing({ ...chunk })}
                        >
                          <Pencil className="h-4 w-4 text-slate-500" />
                        </button>
                        <a
                          className="rounded p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Export CSV"
                          href={exportUrl("csv", { chunkIds: [chunk._id] })}
                        >
                          <Download className="h-4 w-4 text-slate-500" />
                        </a>
                        <button
                          className="rounded p-1.5 hover:bg-red-50 dark:hover:bg-red-950"
                          title="Delete"
                          onClick={() => setConfirm(chunk)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {!loading && rows.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No reports imported yet."
            description="Upload your first Commun CSV or Excel report to start monitoring your campaigns."
            action={
              <Link to="/import" className="btn-primary">
                <Upload className="h-4 w-4" />
                Import Report
              </Link>
            }
          />
        ) : null}

        <Pagination
          pagination={pagination}
          onChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete Chunk?"
        message="This will permanently delete the chunk and its associated delivery records."
        onCancel={() => setConfirm(null)}
        onConfirm={onDelete}
      />

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="card w-full max-w-lg p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Edit chunk</h3>
            <div className="mt-4 space-y-3">
              {[
                ["chunkName", "Chunk Name"],
                ["broadcastName", "Broadcast Name"],
                ["templateName", "Template Name"],
                ["notes", "Notes"],
              ].map(([key, label]) => (
                <div key={key}>
                  <span className="label">{label}</span>
                  <input
                    className="input"
                    value={editing[key] || ""}
                    onChange={(e) => setEditing((s) => ({ ...s, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={onSaveEdit}>
                Save changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

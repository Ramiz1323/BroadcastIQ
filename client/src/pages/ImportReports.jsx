import { useCallback, useRef, useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useToast } from "../components/Toast.jsx";
import { previewUpload, importUpload } from "../services/api.js";
import { formatBytes, formatNumber } from "../utils/format.js";

const SYSTEM_FIELDS = [
  ["templateName", "Template Name"],
  ["phoneNumber", "Phone Number"],
  ["category", "Category"],
  ["error", "Error"],
  ["status", "Status"],
  ["deliveryDateTime", "Delivery Date"],
  ["broadcastName", "Broadcast Name"],
];

let uid = 0;
const nextId = () => `f${Date.now()}-${(uid += 1)}`;

export default function ImportReports() {
  const { push } = useToast();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState([]); // queue of files
  const [expanded, setExpanded] = useState({});
  const [importing, setImporting] = useState(false);

  const patch = useCallback((id, changes) => {
    setItems((list) =>
      list.map((it) => (it.id === id ? { ...it, ...(typeof changes === "function" ? changes(it) : changes) } : it))
    );
  }, []);

  const handleFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []);
      if (!files.length) return;

      const added = files.map((file) => ({
        id: nextId(),
        file,
        preview: null,
        mapping: {},
        meta: {
          chunkName: file.name.replace(/\.[^.]+$/, ""),
          broadcastName: "",
          templateName: "",
          notes: "",
        },
        state: "reading", // reading | ready | error | importing | done | duplicate | failed
        progress: 0,
        result: null,
        duplicate: null,
        error: null,
      }));

      setItems((list) => [...list, ...added]);

      // Preview each file (sequentially so the API isn't hammered)
      for (const item of added) {
        try {
          const res = await previewUpload(item.file);
          patch(item.id, {
            preview: res.data,
            mapping: res.data.mapping || {},
            duplicate: res.data.duplicateOf || null,
            state: res.data.duplicateOf ? "duplicate" : "ready",
          });
        } catch (err) {
          patch(item.id, {
            state: "error",
            error: err.friendlyMessage || "Could not read this file",
          });
        }
      }
    },
    [patch]
  );

  const removeItem = (id) => setItems((list) => list.filter((it) => it.id !== id));
  const resetAll = () => {
    setItems([]);
    setExpanded({});
  };

  const importOne = async (item, force) => {
    patch(item.id, { state: "importing", progress: 0, error: null });
    try {
      const res = await importUpload(item.file, item.meta, item.mapping, force, (p) =>
        patch(item.id, { progress: p })
      );
      patch(item.id, { state: "done", result: res.data.summary, duplicate: null });
      return true;
    } catch (err) {
      if (err.response?.status === 409) {
        patch(item.id, { state: "duplicate", duplicate: err.response.data.data });
      } else {
        patch(item.id, { state: "failed", error: err.friendlyMessage || "Import failed" });
      }
      return false;
    }
  };

  // Imports every file that is ready. Duplicates are skipped unless force = true.
  const importAll = async (force = false) => {
    const queue = items.filter((it) =>
      force ? ["ready", "duplicate", "failed"].includes(it.state) : ["ready", "failed"].includes(it.state)
    );
    if (!queue.length) {
      push("No files ready to import", "error");
      return;
    }
    setImporting(true);
    let ok = 0;
    for (const item of queue) {
      // read the latest version of the item (meta/mapping may have been edited)
      // eslint-disable-next-line no-loop-func
      const latest = await new Promise((resolve) =>
        setItems((list) => {
          resolve(list.find((i) => i.id === item.id) || item);
          return list;
        })
      );
      const success = await importOne(latest, force || latest.state === "duplicate");
      if (success) ok += 1;
    }
    setImporting(false);
    push(`${ok} of ${queue.length} file(s) imported`, ok ? "success" : "error");
  };

  const readyCount = items.filter((i) => i.state === "ready").length;
  const duplicateCount = items.filter((i) => i.state === "duplicate").length;
  const doneCount = items.filter((i) => i.state === "done").length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Import Reports</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload one or more delivery reports downloaded from Commun. Each file becomes its own chunk.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`card flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-14 text-center transition-colors ${
          dragging
            ? "border-brand-500 bg-brand-50 dark:bg-brand-700/10"
            : "border-slate-300 dark:border-slate-700"
        }`}
      >
        <UploadCloud className="h-10 w-10 text-brand-600" />
        <p className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-100">
          Upload Commun Reports
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          CSV, XLS or XLSX · select or drop multiple files
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".csv,.xls,.xlsx"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length ? (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {items.length} file(s) queued · {readyCount} ready · {duplicateCount} duplicate ·{" "}
            {doneCount} imported
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={resetAll} disabled={importing}>
              Clear all
            </button>
            {duplicateCount ? (
              <button className="btn-ghost" onClick={() => importAll(true)} disabled={importing}>
                Import All (incl. duplicates)
              </button>
            ) : null}
            <button className="btn-primary" onClick={() => importAll(false)} disabled={importing}>
              {importing ? "Importing…" : `Import ${readyCount || ""} file(s)`}
            </button>
          </div>
        </div>
      ) : null}

      {items.map((item) => {
        const open = !!expanded[item.id];
        return (
          <div key={item.id} className="card p-5">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="mt-0.5 h-6 w-6 shrink-0 text-brand-600" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                    {item.file.name}
                  </p>
                  <span className="text-xs text-slate-500">{formatBytes(item.file.size)}</span>
                  <StateChip item={item} />
                </div>

                {item.preview ? (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatNumber(item.preview.totalRows)} rows · {item.preview.headers.length} columns
                  </p>
                ) : null}

                {item.state === "reading" ? (
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Reading file…
                  </p>
                ) : null}

                {item.error ? (
                  <p className="mt-2 text-sm text-red-600">{item.error}</p>
                ) : null}

                {item.duplicate ? (
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/40">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        Already imported as {item.duplicate.chunkName} ({item.duplicate.chunkCode})
                      </p>
                      <button
                        className="btn-ghost mt-2"
                        disabled={importing}
                        onClick={() => importOne(item, true)}
                      >
                        Import Anyway
                      </button>
                    </div>
                  </div>
                ) : null}

                {item.state === "importing" ? (
                  <div className="mt-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-brand-600 transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.progress}% uploaded · processing rows…
                    </p>
                  </div>
                ) : null}

                {item.result ? (
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <span className="label">Total Rows</span>
                      <p className="font-semibold">{formatNumber(item.result.totalRows)}</p>
                    </div>
                    <div>
                      <span className="label">Imported</span>
                      <p className="font-semibold text-green-600">{formatNumber(item.result.imported)}</p>
                    </div>
                    <div>
                      <span className="label">Duplicates</span>
                      <p className="font-semibold text-amber-600">{formatNumber(item.result.duplicates)}</p>
                    </div>
                    <div>
                      <span className="label">Invalid</span>
                      <p className="font-semibold text-red-600">{formatNumber(item.result.invalid)}</p>
                    </div>
                  </div>
                ) : null}

                {item.preview ? (
                  <button
                    type="button"
                    className="btn-ghost mt-3 inline-flex items-center gap-1"
                    onClick={() => setExpanded((e) => ({ ...e, [item.id]: !open }))}
                  >
                    {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    Details & column mapping
                  </button>
                ) : null}

                {open && item.preview ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Chunk details
                      </h4>
                      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                              value={item.meta[key]}
                              onChange={(e) =>
                                patch(item.id, (it) => ({
                                  meta: { ...it.meta, [key]: e.target.value },
                                }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Column mapping
                        </h4>
                        <button
                          className="btn-ghost"
                          type="button"
                          onClick={() => patch(item.id, { mapping: item.preview.mapping || {} })}
                        >
                          Auto Detect
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {SYSTEM_FIELDS.map(([key, label]) => (
                          <div key={key}>
                            <span className="label">{label}</span>
                            <select
                              className="input"
                              value={item.mapping[key] || ""}
                              onChange={(e) =>
                                patch(item.id, (it) => ({
                                  mapping: { ...it.mapping, [key]: e.target.value || undefined },
                                }))
                              }
                            >
                              <option value="">— not mapped —</option>
                              {item.preview.headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="table-wrap">
                      <table className="min-w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/60">
                          <tr>
                            {item.preview.headers.map((h) => (
                              <th key={h} className="th">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {item.preview.preview.slice(0, 10).map((row, i) => (
                            <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                              {item.preview.headers.map((h) => (
                                <td key={h} className="td max-w-xs truncate">
                                  {String(row[h] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                onClick={() => removeItem(item.id)}
                disabled={item.state === "importing"}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StateChip({ item }) {
  const map = {
    reading: ["Reading", "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"],
    ready: ["Ready", "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"],
    importing: ["Importing", "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"],
    duplicate: ["Duplicate", "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"],
    done: ["Imported", "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"],
    failed: ["Failed", "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"],
    error: ["Unreadable", "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"],
  };
  const [label, cls] = map[item.state] || map.ready;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {item.state === "done" ? <CheckCircle2 className="h-3 w-3" /> : null}
      {label}
    </span>
  );
}

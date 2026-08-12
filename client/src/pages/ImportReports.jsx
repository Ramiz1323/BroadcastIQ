import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";
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

export default function ImportReports() {
  const { push } = useToast();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState({});
  const [meta, setMeta] = useState({ chunkName: "", broadcastName: "", templateName: "", notes: "" });
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [duplicate, setDuplicate] = useState(null);

  const handleFiles = useCallback(
    async (files) => {
      const selected = files[0];
      if (!selected) return;
      setResult(null);
      setDuplicate(null);
      setFile(selected);
      try {
        const res = await previewUpload(selected);
        setPreview(res.data);
        setMapping(res.data.mapping || {});
        setMeta((m) => ({
          ...m,
          chunkName: m.chunkName || selected.name.replace(/\.[^.]+$/, ""),
        }));
        if (res.data.duplicateOf) setDuplicate(res.data.duplicateOf);
      } catch (err) {
        push(err.friendlyMessage || "Could not read this file", "error");
        setFile(null);
        setPreview(null);
      }
    },
    [push]
  );

  const runImport = async (force = false) => {
    if (!file) return;
    setImporting(true);
    setProgress(0);
    try {
      const res = await importUpload(file, meta, mapping, force, setProgress);
      setResult(res.data.summary);
      setDuplicate(null);
      push("Import completed", "success");
    } catch (err) {
      if (err.response?.status === 409) {
        setDuplicate(err.response.data.data);
        push("This report has already been imported.", "error");
      } else {
        push(err.friendlyMessage || "Import failed", "error");
      }
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setDuplicate(null);
    setMapping({});
    setProgress(0);
    setMeta({ chunkName: "", broadcastName: "", templateName: "", notes: "" });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Import Reports</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload the delivery report you downloaded from Commun.
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
          Upload Commun Report
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">CSV, XLS or XLSX</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".csv,.xls,.xlsx"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {duplicate ? (
        <div className="card border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200">
                This report has already been imported.
              </p>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                Chunk: <strong>{duplicate.chunkName}</strong> ({duplicate.chunkCode}) · Imported:{" "}
                {new Date(duplicate.uploadDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <div className="mt-3 flex gap-2">
                <button className="btn-ghost" onClick={reset}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={() => runImport(true)} disabled={importing}>
                  Import Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {preview ? (
        <>
          <div className="card p-5">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-6 w-6 text-brand-600" />
              <div className="grid flex-1 grid-cols-2 gap-3 text-sm lg:grid-cols-5">
                <div>
                  <span className="label">File Name</span>
                  <p className="truncate font-medium">{preview.fileName}</p>
                </div>
                <div>
                  <span className="label">File Type</span>
                  <p className="font-medium uppercase">{preview.fileType}</p>
                </div>
                <div>
                  <span className="label">File Size</span>
                  <p className="font-medium">{formatBytes(preview.fileSize)}</p>
                </div>
                <div>
                  <span className="label">Detected Rows</span>
                  <p className="font-medium">{formatNumber(preview.totalRows)}</p>
                </div>
                <div>
                  <span className="label">Detected Columns</span>
                  <p className="font-medium">{preview.headers.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Chunk details</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                    value={meta[key]}
                    onChange={(e) => setMeta((m) => ({ ...m, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Column mapping</h3>
              <button
                className="btn-ghost"
                onClick={() => setMapping(preview.mapping || {})}
                type="button"
              >
                Auto Detect
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {SYSTEM_FIELDS.map(([key, label]) => (
                <div key={key}>
                  <span className="label">{label}</span>
                  <select
                    className="input"
                    value={mapping[key] || ""}
                    onChange={(e) =>
                      setMapping((m) => ({ ...m, [key]: e.target.value || undefined }))
                    }
                  >
                    <option value="">— not mapped —</option>
                    {preview.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden">
            <h3 className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Preview (first {preview.preview.length} rows)
            </h3>
            <div className="table-wrap">
              <table className="min-w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/60">
                  <tr>
                    {preview.headers.map((h) => (
                      <th key={h} className="th">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row, i) => (
                    <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                      {preview.headers.map((h) => (
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

          {importing ? (
            <div className="card p-5">
              <p className="text-sm font-medium">Importing…</p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">{progress}% uploaded · processing rows…</p>
            </div>
          ) : null}

          {result ? (
            <div className="card p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">Import Completed</p>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <span className="label">Total Rows</span>
                      <p className="font-semibold">{formatNumber(result.totalRows)}</p>
                    </div>
                    <div>
                      <span className="label">Imported</span>
                      <p className="font-semibold text-green-600">{formatNumber(result.imported)}</p>
                    </div>
                    <div>
                      <span className="label">Duplicates</span>
                      <p className="font-semibold text-amber-600">{formatNumber(result.duplicates)}</p>
                    </div>
                    <div>
                      <span className="label">Invalid</span>
                      <p className="font-semibold text-red-600">{formatNumber(result.invalid)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="btn-ghost" onClick={reset}>
                      Import another file
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {!result && !duplicate ? (
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={reset}>
                Cancel
              </button>
              <button className="btn-primary" onClick={() => runImport(false)} disabled={importing}>
                Confirm Import
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

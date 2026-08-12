import { useCallback, useEffect, useState } from "react";
import { Download, Play, Save, Trash2, FileBarChart } from "lucide-react";
import FilterBar, { EMPTY_FILTERS } from "../components/FilterBar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useToast } from "../components/Toast.jsx";
import {
  listChunks,
  getFacets,
  previewReport,
  listSavedReports,
  createSavedReport,
  deleteSavedReport,
  runSavedReport,
  exportUrl,
} from "../services/api.js";
import { formatDateTime, formatNumber, percentage } from "../utils/format.js";

export default function Reports() {
  const { push } = useToast();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [facets, setFacets] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState([]);
  const [reportName, setReportName] = useState("");

  useEffect(() => {
    Promise.all([getFacets(), listChunks({ limit: 200 })])
      .then(([f, c]) => {
        setFacets(f.data);
        setChunks(c.data);
      })
      .catch((err) => push(err.friendlyMessage || "Failed to load filters", "error"));
  }, [push]);

  const loadSaved = useCallback(() => {
    listSavedReports()
      .then((res) => setSaved(res.data))
      .catch((err) => push(err.friendlyMessage || "Failed to load saved reports", "error"));
  }, [push]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const generate = async (f = filters) => {
    setGenerating(true);
    try {
      const res = await previewReport(f);
      setResult(res.data);
    } catch (err) {
      push(err.friendlyMessage || "Failed to generate report", "error");
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!reportName.trim()) {
      push("Give the report a name first", "error");
      return;
    }
    try {
      await createSavedReport({ name: reportName.trim(), filters });
      setReportName("");
      push("Report saved", "success");
      loadSaved();
    } catch (err) {
      push(err.friendlyMessage || "Failed to save report", "error");
    }
  };

  const run = async (report) => {
    try {
      const res = await runSavedReport(report._id);
      setFilters({ ...EMPTY_FILTERS, ...res.data.filters });
      await generate({ ...EMPTY_FILTERS, ...res.data.filters });
      push(`Report "${report.name}" ran with ${formatNumber(res.data.summary.total || 0)} records`, "success");
      loadSaved();
    } catch (err) {
      push(err.friendlyMessage || "Failed to run report", "error");
    }
  };

  const remove = async (report) => {
    try {
      await deleteSavedReport(report._id);
      push("Report deleted", "success");
      loadSaved();
    } catch (err) {
      push(err.friendlyMessage || "Failed to delete report", "error");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create Report</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Select chunks, combine them, filter and export as CSV or Excel.
        </p>
      </div>

      <FilterBar
        facets={facets}
        chunks={chunks}
        value={filters}
        onApply={(f) => {
          setFilters(f);
          generate(f);
        }}
        onReset={(f) => {
          setFilters(f);
          setResult(null);
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-primary" onClick={() => generate()} disabled={generating}>
          <Play className="h-4 w-4" />
          {generating ? "Generating…" : "Generate Report"}
        </button>
        <a className="btn-ghost" href={exportUrl("csv", filters)}>
          <Download className="h-4 w-4" />
          Export CSV
        </a>
        <a className="btn-ghost" href={exportUrl("excel", filters)}>
          <Download className="h-4 w-4" />
          Export Excel
        </a>
        <div className="ml-auto flex gap-2">
          <input
            className="input w-56"
            placeholder="Save as… e.g. Startup Failed"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
          />
          <button className="btn-ghost" onClick={save}>
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>

      {result ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Report Summary</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Selected Chunks</dt>
                <dd className="font-semibold">{formatNumber(result.selectedChunks)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Total Records</dt>
                <dd className="font-semibold">{formatNumber(result.totalRecords)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Filtered Records</dt>
                <dd className="font-semibold text-brand-600">{formatNumber(result.filteredRecords)}</dd>
              </div>
            </dl>
          </div>

          <div className="card overflow-hidden lg:col-span-2">
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
                  {Object.entries(result.summary)
                    .filter(([k]) => k !== "total")
                    .map(([status, count]) => (
                      <tr key={status} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="td">
                          <StatusBadge status={status} />
                        </td>
                        <td className="td">{formatNumber(count)}</td>
                        <td className="td">{percentage(count, result.summary.total)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      <div className="card">
        <h3 className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Saved Reports
        </h3>
        {saved.length === 0 ? (
          <EmptyState
            icon={FileBarChart}
            title="No saved reports"
            description="Apply filters above and save them as a reusable report."
          />
        ) : (
          <div className="table-wrap">
            <table className="min-w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="th">Name</th>
                  <th className="th">Last Run</th>
                  <th className="th">Records</th>
                  <th className="th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {saved.map((report) => (
                  <tr key={report._id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="td font-medium">{report.name}</td>
                    <td className="td">{report.lastRunAt ? formatDateTime(report.lastRunAt) : "—"}</td>
                    <td className="td">{formatNumber(report.lastRunCount)}</td>
                    <td className="td">
                      <div className="flex gap-1">
                        <button
                          className="rounded p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                          onClick={() => run(report)}
                          title="Run report"
                        >
                          <Play className="h-4 w-4 text-slate-500" />
                        </button>
                        <a
                          className="rounded p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                          href={exportUrl("excel", report.filters)}
                          title="Export Excel"
                        >
                          <Download className="h-4 w-4 text-slate-500" />
                        </a>
                        <button
                          className="rounded p-1.5 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => remove(report)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
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

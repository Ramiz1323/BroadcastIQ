import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download } from "lucide-react";
import FilterBar, { EMPTY_FILTERS } from "../components/FilterBar.jsx";
import DeliveryTable from "../components/DeliveryTable.jsx";
import { useToast } from "../components/Toast.jsx";
import { listDeliveries, listChunks, getFacets, exportUrl } from "../services/api.js";
import { formatNumber } from "../utils/format.js";

export default function Recipients() {
  const { push } = useToast();
  const [params] = useSearchParams();
  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
    chunkIds: params.get("chunkIds") ? params.get("chunkIds").split(",") : [],
    statuses: params.get("statuses") ? params.get("statuses").split(",") : [],
  });
  const [facets, setFacets] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getFacets(), listChunks({ limit: 200 })])
      .then(([f, c]) => {
        setFacets(f.data);
        setChunks(c.data);
      })
      .catch((err) => push(err.friendlyMessage || "Failed to load filters", "error"));
  }, [push]);

  const load = useCallback(() => {
    setLoading(true);
    listDeliveries({ ...filters, page, limit })
      .then((res) => {
        setRecords(res.data);
        setSummary(res.summary);
        setPagination(res.pagination);
      })
      .catch((err) => push(err.friendlyMessage || "Failed to load recipients", "error"))
      .finally(() => setLoading(false));
  }, [filters, page, limit, push]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recipient Delivery Details</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {formatNumber(summary.total || 0)} records
          </p>
        </div>
        <div className="flex gap-2">
          <a className="btn-ghost" href={exportUrl("csv", filters)}>
            <Download className="h-4 w-4" />
            Export CSV
          </a>
          <a className="btn-primary" href={exportUrl("excel", filters)}>
            <Download className="h-4 w-4" />
            Export Excel
          </a>
        </div>
      </div>

      <FilterBar
        facets={facets}
        chunks={chunks}
        value={filters}
        onApply={(f) => {
          setFilters(f);
          setPage(1);
        }}
        onReset={(f) => {
          setFilters(f);
          setPage(1);
        }}
      />

      <DeliveryTable
        records={records}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />
    </div>
  );
}

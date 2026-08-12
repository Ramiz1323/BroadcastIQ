import { useEffect, useState } from "react";
import { Filter, RotateCcw, Search } from "lucide-react";
import MultiSelect from "./MultiSelect.jsx";
import { ALL_STATUSES } from "../utils/format.js";

export const EMPTY_FILTERS = {
  chunkIds: [],
  broadcastNames: [],
  templateNames: [],
  statuses: [],
  categories: [],
  fromDate: "",
  toDate: "",
  uploadedFrom: "",
  uploadedTo: "",
  phone: "",
  error: "",
  search: "",
};

export default function FilterBar({ facets, chunks, value, onApply, onReset }) {
  const [draft, setDraft] = useState(value || EMPTY_FILTERS);

  useEffect(() => {
    setDraft(value || EMPTY_FILTERS);
  }, [value]);

  const set = (key, val) => setDraft((d) => ({ ...d, [key]: val }));

  return (
    <div className="card p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <Filter className="h-4 w-4 text-brand-600" />
        Filters
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MultiSelect
          label="Chunks"
          placeholder="All chunks"
          options={(chunks || []).map((c) => ({ value: c._id, label: c.chunkName }))}
          value={draft.chunkIds}
          onChange={(v) => set("chunkIds", v)}
        />
        <MultiSelect
          label="Broadcast"
          placeholder="All broadcasts"
          options={facets?.broadcastNames || []}
          value={draft.broadcastNames}
          onChange={(v) => set("broadcastNames", v)}
        />
        <MultiSelect
          label="Template"
          placeholder="All templates"
          options={facets?.templateNames || []}
          value={draft.templateNames}
          onChange={(v) => set("templateNames", v)}
        />
        <MultiSelect
          label="Status"
          placeholder="All statuses"
          options={ALL_STATUSES}
          value={draft.statuses}
          onChange={(v) => set("statuses", v)}
        />

        <div>
          <span className="label">Delivery from</span>
          <input
            type="date"
            className="input"
            value={draft.fromDate}
            onChange={(e) => set("fromDate", e.target.value)}
          />
        </div>
        <div>
          <span className="label">Delivery to</span>
          <input
            type="date"
            className="input"
            value={draft.toDate}
            onChange={(e) => set("toDate", e.target.value)}
          />
        </div>
        <div>
          <span className="label">Uploaded from</span>
          <input
            type="date"
            className="input"
            value={draft.uploadedFrom}
            onChange={(e) => set("uploadedFrom", e.target.value)}
          />
        </div>
        <div>
          <span className="label">Uploaded to</span>
          <input
            type="date"
            className="input"
            value={draft.uploadedTo}
            onChange={(e) => set("uploadedTo", e.target.value)}
          />
        </div>

        <div>
          <span className="label">Phone number</span>
          <input
            className="input"
            placeholder="e.g. 9510131730"
            value={draft.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <MultiSelect
          label="Category"
          placeholder="All categories"
          options={facets?.categories || []}
          value={draft.categories}
          onChange={(v) => set("categories", v)}
        />
        <div>
          <span className="label">Error contains</span>
          <input
            className="input"
            placeholder="e.g. ecosystem engagement"
            value={draft.error}
            onChange={(e) => set("error", e.target.value)}
          />
        </div>
        <div>
          <span className="label">Search</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Phone, broadcast, template, error"
              value={draft.search}
              onChange={(e) => set("search", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button className="btn-ghost" onClick={() => onReset(EMPTY_FILTERS)}>
          <RotateCcw className="h-4 w-4" />
          Reset Filters
        </button>
        <button className="btn-primary" onClick={() => onApply(draft)}>
          <Filter className="h-4 w-4" />
          Apply Filters
        </button>
      </div>
    </div>
  );
}

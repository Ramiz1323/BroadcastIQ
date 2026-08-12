import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export default function MultiSelect({ label, options, value = [], onChange, placeholder = "All" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggle = (option) => {
    const key = typeof option === "string" ? option : option.value;
    onChange(value.includes(key) ? value.filter((v) => v !== key) : [...value, key]);
  };

  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  const summary = value.length
    ? normalized
        .filter((o) => value.includes(o.value))
        .map((o) => o.label)
        .join(", ")
    : placeholder;

  return (
    <div ref={ref} className="relative">
      {label ? <span className="label">{label}</span> : null}
      <button
        type="button"
        className="input flex items-center justify-between gap-2 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="truncate text-slate-600 dark:text-slate-300">{summary}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>
      {open ? (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {normalized.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-400">No options</p>
          ) : (
            normalized.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                    value.includes(option.value)
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                >
                  {value.includes(option.value) ? <Check className="h-3 w-3" /> : null}
                </span>
                <span className="truncate">{option.label}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Database, Moon, Sun, ShieldCheck } from "lucide-react";
import useTheme from "../hooks/useTheme.js";
import { health } from "../services/api.js";

export default function Settings() {
  const { theme, toggle } = useTheme();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    health()
      .then((res) => setStatus(res.data))
      .catch(() => setStatus({ server: "down", database: "disconnected" }));
  }, []);

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Application preferences and backend status.
        </p>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <div>
              <p className="text-sm font-semibold">Appearance</p>
              <p className="text-xs text-slate-500">Preference is stored in your browser.</p>
            </div>
          </div>
          <button className="btn-ghost" onClick={toggle}>
            Switch to {theme === "dark" ? "light" : "dark"} mode
          </button>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-brand-600" />
          <div>
            <p className="text-sm font-semibold">Backend</p>
            <p className="text-xs text-slate-500">
              API: {status?.server || "checking"} · Database: {status?.database || "checking"} ·
              db name: monitor
            </p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-semibold">Security</p>
            <p className="text-xs text-slate-500">
              The MongoDB connection string lives only in the server .env file and is never sent to
              the browser. All database access happens through the Express API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Radio,
  Boxes,
  Users,
  FileBarChart,
  Upload,
  Settings as SettingsIcon,
  Menu,
  Moon,
  Sun,
} from "lucide-react";
import useTheme from "../hooks/useTheme.js";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/broadcasts", label: "Broadcasts", icon: Radio },
  { to: "/chunks", label: "Chunks", icon: Boxes },
  { to: "/recipients", label: "Recipients", icon: Users },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/import", label: "Import Reports", icon: Upload },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function DashboardLayout() {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
          C
        </span>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">Commun Monitor</p>
          <p className="text-xs text-slate-400">Broadcast reports</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-700/20 dark:text-brand-200"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
        {sidebar}
      </aside>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-slate-900">
            {sidebar}
          </aside>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <button className="btn-ghost px-2 py-1.5 lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-4 w-4" />
          </button>
          <h1 className="hidden text-sm font-semibold text-slate-600 dark:text-slate-300 sm:block">
            Commun Broadcast Monitor
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <button className="btn-ghost px-2 py-1.5" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
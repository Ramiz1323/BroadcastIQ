import { Inbox } from "lucide-react";

export default function EmptyState({ title, description, action, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="rounded-full bg-slate-100 p-4 text-slate-400 dark:bg-slate-800">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: 0, label: "Pending" },
  { value: 1, label: "In progress" },
  { value: 2, label: "Done" },
];

const PRIORITY_LABELS = {
  0: "Low",
  1: "Medium",
  2: "High",
};

const PRIORITY_CLASSES = {
  0: "bg-emerald-100 text-emerald-700",
  1: "bg-amber-100 text-amber-700",
  2: "bg-rose-100 text-rose-700",
};

const STATUS_LOOKUP = {
  pending: 0,
  in_progress: 1,
  done: 2,
  completed: 2,
};

const PRIORITY_LOOKUP = {
  low: 0,
  medium: 1,
  high: 2,
};

const normalizeStatus = (value) =>
  typeof value === "number" ? value : STATUS_LOOKUP[String(value)] || 0;

const normalizePriority = (value) =>
  typeof value === "number" ? value : PRIORITY_LOOKUP[String(value)] || 0;

export function TaskCard({ task, isSaving, onStatusChange }) {
  const status = normalizeStatus(task.status);
  const priority = normalizePriority(task.priority);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">{task.title || "Untitled task"}</h3>
        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-semibold",
            PRIORITY_CLASSES[priority] || PRIORITY_CLASSES[0],
          ].join(" ")}
        >
          {PRIORITY_LABELS[priority] || "Low"} priority
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={[
              "rounded-full px-3 py-1 text-sm font-medium transition",
              status === option.value
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-indigo-100",
            ].join(" ")}
            disabled={isSaving}
            onClick={() => onStatusChange(task, option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </article>
  );
}

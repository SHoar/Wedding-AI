import {
  ClipboardDocumentListIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { TaskCard } from "../components/TaskCard";
import { useApi } from "../hooks/useApi";

const INITIAL_FORM = {
  title: "",
  priority: 1,
  status: 0,
};

export function TasksPage() {
  const { getTasks, addTask, updateTask } = useApi();
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState(null);

  useEffect(() => {
    let active = true;

    const loadTasks = async () => {
      setError("");
      setIsLoading(true);

      try {
        const data = await getTasks();
        if (active) {
          setTasks(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load tasks.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadTasks();

    return () => {
      active = false;
    };
  }, [getTasks]);

  const handleAddTask = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Task title is required.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const created = await addTask({
        title: form.title,
        priority: Number(form.priority),
        status: Number(form.status),
      });
      setTasks((current) => [created, ...current]);
      setForm(INITIAL_FORM);
    } catch (saveError) {
      setError(saveError.message || "Unable to add task.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (task, nextStatus) => {
    setError("");
    setSavingTaskId(task.id);

    try {
      const updated = await updateTask(task.id, { status: nextStatus });
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, ...updated } : item
        )
      );
    } catch (updateError) {
      setError(updateError.message || "Unable to update task status.");
    } finally {
      setSavingTaskId(null);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Create task</h2>
        <p className="mt-1 text-sm text-slate-600">
          Track vendor, venue, and checklist actions for the wedding team.
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleAddTask}>
          <label className="block text-sm font-medium text-slate-700">
            Title
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-indigo-200 focus:ring-2"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Confirm transportation timeline"
              required
              value={form.title}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Priority
            <select
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none ring-indigo-200 focus:ring-2"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  priority: Number(event.target.value),
                }))
              }
              value={form.priority}
            >
              <option value={0}>Low</option>
              <option value={1}>Medium</option>
              <option value={2}>High</option>
            </select>
          </label>

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            <PlusIcon className="size-4" />
            {isSaving ? "Saving..." : "Add task"}
          </button>
        </form>

        {error ? (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <div className="flex items-center gap-2">
          <ClipboardDocumentListIcon className="size-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Wedding tasks ({tasks.length})
          </h2>
        </div>
        <div className="mt-4 space-y-3">
          {tasks.map((task) => (
            <TaskCard
              isSaving={savingTaskId === task.id}
              key={task.id || task.title}
              onStatusChange={handleStatusChange}
              task={task}
            />
          ))}

          {!tasks.length && !isLoading ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No tasks yet. Add one to start planning.
            </p>
          ) : null}

          {isLoading ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Loading tasks...
            </p>
          ) : null}
        </div>
      </article>
    </section>
  );
}

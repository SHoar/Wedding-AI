import { CalendarDaysIcon, ClockIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import { StatCard } from "../components/StatCard";
import { useActiveWeddingId } from "../hooks/useActiveWeddingId";
import { useApi } from "../hooks/useApi";

const TIMELINE = [
  { time: "2:00 PM", title: "Ceremony", location: "Rose Garden" },
  { time: "3:30 PM", title: "Cocktail Hour", location: "Lakeside Terrace" },
  { time: "5:00 PM", title: "Reception Opens", location: "Grand Hall" },
  { time: "7:30 PM", title: "First Dance", location: "Main Stage" },
  { time: "10:30 PM", title: "Send-off", location: "Front Courtyard" },
];

const statusValue = (status) => {
  if (typeof status === "number") return status;

  switch (status) {
    case "in_progress":
      return 1;
    case "done":
    case "completed":
      return 2;
    default:
      return 0;
  }
};

export function DashboardPage() {
  const { getGuests, getTasks, getGuestbookEntries } = useApi();
  const {
    weddingId: resolvedWeddingId,
    isLoading: isResolvingWedding,
    error: weddingResolveError,
  } = useActiveWeddingId();
  const [guests, setGuests] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [guestData, taskData, entryData] = await Promise.all([
          getGuests(),
          getTasks(),
          getGuestbookEntries(resolvedWeddingId),
        ]);

        if (!active) return;

        setGuests(Array.isArray(guestData) ? guestData : []);
        setTasks(Array.isArray(taskData) ? taskData : []);
        setEntries(Array.isArray(entryData) ? entryData : []);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load dashboard data.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [getGuests, getGuestbookEntries, getTasks, resolvedWeddingId]);

  const metrics = useMemo(() => {
    const totalGuests = guests.length;
    const guestsWithContact = guests.filter((g) => g.email || g.phone).length;
    const dietaryRequests = guests.filter((g) => g.dietary_notes).length;
    const projectedAttendance =
      totalGuests +
      guests.reduce((sum, guest) => sum + Number.parseInt(guest.plus_one_count || 0, 10), 0);

    const doneCount = tasks.filter((task) => statusValue(task.status) === 2).length;
    const completionRate = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

    return {
      totalGuests,
      guestsWithContact,
      dietaryRequests,
      projectedAttendance,
      completionRate,
      doneCount,
    };
  }, [guests, tasks]);

  return (
    <section className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {weddingResolveError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {weddingResolveError}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Guest records" value={metrics.totalGuests} hint="Current RSVP entries" />
        <StatCard
          label="Projected attendance"
          value={metrics.projectedAttendance}
          hint="Guest count + plus ones"
        />
        <StatCard
          label="Tasks completed"
          value={`${metrics.doneCount}/${tasks.length}`}
          hint={`${metrics.completionRate}% completion`}
        />
        <StatCard
          label="Dietary requests"
          value={metrics.dietaryRequests}
          hint="Requires catering follow-up"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2">
            <ClockIcon className="size-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">Day-of timeline</h2>
          </div>
          <ol className="mt-4 space-y-3">
            {TIMELINE.map((item) => (
              <li key={item.title} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-indigo-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.time}</p>
                  <p className="text-sm text-slate-700">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.location}</p>
                </div>
              </li>
            ))}
          </ol>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="size-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">Guest status</h2>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <dt className="text-slate-600">Profiles with contact info</dt>
              <dd className="font-semibold text-slate-900">{metrics.guestsWithContact}</dd>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <dt className="text-slate-600">Guestbook signatures</dt>
              <dd className="font-semibold text-slate-900">{entries.length}</dd>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <dt className="text-slate-600">Open action items</dt>
              <dd className="font-semibold text-slate-900">
                {Math.max(tasks.length - metrics.doneCount, 0)}
              </dd>
            </div>
          </dl>
        </article>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="size-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">Recent guestbook notes</h2>
          </div>
          <p className="text-sm text-slate-500">
            Wedding id {resolvedWeddingId}
            {isLoading || isResolvingWedding ? " • refreshing..." : ""}
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {entries.slice(0, 3).map((entry) => (
            <blockquote
              key={entry.id || `${entry.guest_name}-${entry.message}`}
              className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700"
            >
              <p className="line-clamp-3">"{entry.message}"</p>
              <footer className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {entry.guest_name || entry.name || "Guest"}
              </footer>
            </blockquote>
          ))}

          {!entries.length && !isLoading ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 md:col-span-3">
              Guestbook entries will appear here once guests start leaving messages.
            </p>
          ) : null}
        </div>
      </article>
    </section>
  );
}

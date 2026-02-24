import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { GuestbookEntry } from "../components/GuestbookEntry";
import { useActiveWeddingId } from "../hooks/useActiveWeddingId";
import { useApi } from "../hooks/useApi";

export function GuestbookPage({ weddingId }) {
  const { getGuestbookEntries, addGuestbookEntry } = useApi();
  const {
    weddingId: resolvedWeddingId,
    isLoading: isResolvingWedding,
    error: weddingResolveError,
  } = useActiveWeddingId(weddingId);
  const [entries, setEntries] = useState([]);
  const [guestName, setGuestName] = useState("");
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const loadEntries = async () => {
      setError("");
      setIsLoading(true);
      try {
        const data = await getGuestbookEntries(resolvedWeddingId);
        if (active) {
          setEntries(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load guestbook entries.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadEntries();

    return () => {
      active = false;
    };
  }, [getGuestbookEntries, resolvedWeddingId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!guestName.trim() || !message.trim()) {
      setError("Name and message are required.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const created = await addGuestbookEntry({
        guest_name: guestName,
        message,
        is_public: isPublic,
        wedding_id: resolvedWeddingId,
      });
      setEntries((current) => [created, ...current]);
      setMessage("");
    } catch (saveError) {
      setError(saveError.message || "Unable to save guestbook message.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <PencilSquareIcon className="size-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Sign the guestbook</h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Collect celebratory notes and publish public entries in real time.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Posting to wedding id <span className="font-semibold">{resolvedWeddingId}</span>
          {isResolvingWedding ? " (resolving...)" : ""}.
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Name
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-indigo-200 focus:ring-2"
              onChange={(event) => setGuestName(event.target.value)}
              placeholder="Enter your name"
              required
              value={guestName}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Message
            <textarea
              className="mt-1 min-h-28 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-indigo-200 focus:ring-2"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Wishing you both a lifetime of joy..."
              required
              value={message}
            />
          </label>

          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              checked={isPublic}
              className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              onChange={(event) => setIsPublic(event.target.checked)}
              type="checkbox"
            />
            Publish this entry publicly
          </label>

          <button
            className="w-full rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving || isResolvingWedding}
            type="submit"
          >
            {isSaving ? "Saving..." : "Sign guestbook"}
          </button>
        </form>

        {error ? (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        {weddingResolveError ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {weddingResolveError}
          </p>
        ) : null}
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <h2 className="text-lg font-semibold text-slate-900">Messages ({entries.length})</h2>
        <div className="mt-4 space-y-3">
          {entries.map((entry) => (
            <GuestbookEntry entry={entry} key={entry.id || `${entry.guest_name}-${entry.message}`} />
          ))}

          {!entries.length && !isLoading ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No entries yet. The first note starts the story.
            </p>
          ) : null}

          {isLoading ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Loading guestbook entries...
            </p>
          ) : null}
        </div>
      </article>
    </section>
  );
}

import { DocumentTextIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api/client";
import { ROUTES } from "../constants/routes";

export function FAQLandingPage() {
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const res = await http.get("/api/docs");
        const list = Array.isArray(res.data) ? res.data : [];
        if (!cancelled) setDocs(list);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || err.message || "Unable to load FAQ.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useCallback(() => {
    const q = search.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter(
      (d) =>
        (d.title && d.title.toLowerCase().includes(q)) ||
        (d.slug && d.slug.toLowerCase().includes(q))
    );
  }, [docs, search])();

  return (
    <section className="space-y-6">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="size-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">FAQ &amp; Documentation</h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Browse and search the app documentation.
        </p>

        <label className="mt-4 block">
          <span className="sr-only">Search FAQ</span>
          <span className="relative block">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-300 py-2 pl-10 pr-3 text-slate-900 outline-none ring-rose-200 focus:ring-2"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
              type="search"
              value={search}
            />
          </span>
        </label>
      </article>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length ? (
            filtered.map((doc) => (
              <Link
                key={doc.slug}
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-rose-200 hover:shadow-md"
                to={`${ROUTES.FAQ}/${doc.slug}`}
              >
                <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{doc.slug}.md</p>
              </Link>
            ))
          ) : (
            <p className="col-span-full rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              {docs.length ? "No docs match your search." : "No documentation available."}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">Page not found</h2>
      <p className="mt-2 text-slate-600">
        The page you requested does not exist in this dashboard.
      </p>
      <Link
        className="mt-4 inline-flex rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500"
        to="/"
      >
        Back to dashboard
      </Link>
    </section>
  );
}

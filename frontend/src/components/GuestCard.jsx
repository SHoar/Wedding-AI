const valueOrDash = (value) => (value || value === 0 ? value : "-");

export function GuestCard({ guest }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{guest.name || "Unnamed guest"}</h3>
      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <p>
          <span className="font-medium text-slate-800">Email:</span>{" "}
          {valueOrDash(guest.email)}
        </p>
        <p>
          <span className="font-medium text-slate-800">Phone:</span>{" "}
          {valueOrDash(guest.phone)}
        </p>
        <p>
          <span className="font-medium text-slate-800">Plus ones:</span>{" "}
          {valueOrDash(guest.plus_one_count)}
        </p>
        <p className="sm:col-span-2">
          <span className="font-medium text-slate-800">Dietary notes:</span>{" "}
          {valueOrDash(guest.dietary_notes)}
        </p>
      </div>
    </article>
  );
}

export function GuestbookEntry({ entry }) {
  const author = entry.guest_name || entry.name || "Guest";
  const isPublic = entry.is_public ?? true;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">{author}</h3>
        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-semibold",
            isPublic ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700",
          ].join(" ")}
        >
          {isPublic ? "Public" : "Private"}
        </span>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {entry.message || ""}
      </p>
    </article>
  );
}

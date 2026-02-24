import { PlusIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { GuestCard } from "../components/GuestCard";
import { useApi } from "../hooks/useApi";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  plus_one_count: 0,
  dietary_notes: "",
};

export function GuestsPage() {
  const { getGuests, addGuest } = useApi();
  const [guests, setGuests] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const loadGuests = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await getGuests();
        if (active) {
          setGuests(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load guests.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadGuests();

    return () => {
      active = false;
    };
  }, [getGuests]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Guest name is required.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const created = await addGuest({
        ...form,
        plus_one_count: Number(form.plus_one_count) || 0,
      });
      setGuests((current) => [created, ...current]);
      setForm(EMPTY_FORM);
    } catch (saveError) {
      setError(saveError.message || "Unable to save guest.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateForm = (field) => (event) =>
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Add a guest</h2>
        <p className="mt-1 text-sm text-slate-600">
          Capture contact details and any RSVP context for planning.
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Name
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-indigo-200 focus:ring-2"
              onChange={updateForm("name")}
              placeholder="Taylor Morgan"
              required
              value={form.name}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-indigo-200 focus:ring-2"
              onChange={updateForm("email")}
              placeholder="taylor@example.com"
              type="email"
              value={form.email}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Phone
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-indigo-200 focus:ring-2"
              onChange={updateForm("phone")}
              placeholder="+1 555 111 2222"
              value={form.phone}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Plus ones
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-indigo-200 focus:ring-2"
              min="0"
              onChange={updateForm("plus_one_count")}
              type="number"
              value={form.plus_one_count}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Dietary notes
            <textarea
              className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-indigo-200 focus:ring-2"
              onChange={updateForm("dietary_notes")}
              placeholder="Vegetarian, no nuts..."
              value={form.dietary_notes}
            />
          </label>

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            <PlusIcon className="size-4" />
            {isSaving ? "Saving..." : "Add guest"}
          </button>
        </form>

        {error ? (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <div className="flex items-center gap-2">
          <UserGroupIcon className="size-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Guest list</h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">{guests.length} guests currently tracked</p>

        <div className="mt-4 space-y-3">
          {guests.map((guest) => (
            <GuestCard guest={guest} key={guest.id || `${guest.name}-${guest.email}`} />
          ))}

          {!guests.length && !isLoading ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No guests yet. Add your first guest from the form.
            </p>
          ) : null}

          {isLoading ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Loading guests...</p>
          ) : null}
        </div>
      </article>
    </section>
  );
}

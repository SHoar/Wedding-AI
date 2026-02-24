import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import {
  Bars3Icon,
  HeartIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { NavLink, Outlet } from "react-router-dom";
import { ROUTES } from "../constants/routes";

const navigation = [
  { name: "Dashboard", to: ROUTES.HOME },
  { name: "Guests", to: ROUTES.GUESTS },
  { name: "Guestbook", to: ROUTES.GUESTBOOK },
  { name: "Tasks", to: ROUTES.TASKS },
  { name: "Wedding AI", to: ROUTES.AI },
];

const linkClasses = ({ isActive }) =>
  [
    "rounded-full px-4 py-2 text-sm font-semibold transition",
    isActive
      ? "bg-rose-600 text-white shadow-sm"
      : "text-slate-700 hover:bg-rose-100 hover:text-rose-700",
  ].join(" ");

export function MainLayout() {
  return (
    <div className="min-h-screen">
      <Disclosure
        as="nav"
        className="border-b border-rose-100 bg-white/80 backdrop-blur"
      >
        {({ open }) => (
          <>
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-rose-100 p-2 text-rose-600">
                  <HeartIcon className="size-5" />
                </div>
                <span className="text-lg font-semibold tracking-tight text-slate-900">
                  Wedding Coordination
                </span>
              </div>

              <div className="hidden items-center gap-2 md:flex">
                {navigation.map((item) => (
                  <NavLink key={item.to} className={linkClasses} to={item.to}>
                    {item.name}
                  </NavLink>
                ))}
              </div>

              <DisclosureButton className="rounded-md p-2 text-slate-700 hover:bg-rose-100 md:hidden">
                <span className="sr-only">Toggle navigation</span>
                {open ? (
                  <XMarkIcon className="size-6" />
                ) : (
                  <Bars3Icon className="size-6" />
                )}
              </DisclosureButton>
            </div>

            <DisclosurePanel className="border-t border-rose-100 px-4 pb-4 md:hidden">
              <div className="mt-3 space-y-2">
                {navigation.map((item) => (
                  <NavLink key={item.to} className={linkClasses} to={item.to}>
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </DisclosurePanel>
          </>
        )}
      </Disclosure>

      <header className="mx-auto mt-8 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="relative overflow-hidden rounded-3xl border border-rose-100 bg-white p-8 shadow-sm">
            <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-rose-100/70 to-transparent lg:block" />
            <div className="relative space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-rose-700">
                <SparklesIcon className="size-4" />
                Alex & Jordan - June 18, 2026
              </p>
              <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                One dashboard for guest logistics, day-of tasks, and AI-assisted
                Q&A.
              </h1>
              <p className="max-w-2xl text-slate-600">
                Keep your timeline, RSVP progress, and guest communications in
                sync with your Rails + LangChain + PydanticAI stack.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm">
            <img
              alt="Alex and Jordan wedding banner"
              className="h-full w-full object-cover"
              src="/couple-banner.svg"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

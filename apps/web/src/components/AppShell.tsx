import Link from "next/link";
import { navigationItems } from "@/lib/navigation";

const summaryItems = [
  { label: "Active projects", value: "0" },
  { label: "Open tasks", value: "0" },
  { label: "Team members", value: "0" },
] as const;

export function AppShell() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-neutral-200 bg-white px-6 py-5 lg:border-b-0 lg:border-r">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              DevFlow
            </p>
            <p className="mt-1 text-sm text-neutral-500">Project workspace</p>
          </div>

          <nav aria-label="Primary navigation" className="flex gap-2 lg:flex-col">
            {navigationItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-8 border-t border-neutral-200 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Account
            </p>
            <div className="flex gap-2 lg:flex-col">
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950"
              >
                Sign up
              </Link>
            </div>
          </div>
        </aside>

        <section className="px-6 py-8 sm:px-8 lg:px-10">
          <header className="mb-8 flex flex-col gap-3 border-b border-neutral-200 pb-6">
            <p className="text-sm font-medium text-emerald-700">Initial scaffold</p>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-normal text-neutral-950 sm:text-4xl">
              DevFlow — Professional Project Management Platform
            </h1>
            <p className="max-w-2xl text-base leading-7 text-neutral-600">
              A clean starting point for learning full-stack product development with a monorepo,
              typed apps, shared validation, PostgreSQL, tests, and CI.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-3">
            {summaryItems.map((item) => (
              <div key={item.label} className="rounded-md border border-neutral-200 bg-white p-4">
                <p className="text-sm text-neutral-500">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-neutral-950">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

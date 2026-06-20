"use client";

import Link from "next/link";
import { NotificationList } from "@/components/NotificationList";
import { useRequireUser } from "@/lib/useRequireUser";

export default function NotificationsPage() {
  // Reuses the app-wide auth guard: redirects to /login when there is no session.
  const user = useRequireUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <Link href="/dashboard" className="text-sm font-medium text-emerald-700 hover:underline">
          ← Back to dashboard
        </Link>

        <header className="mt-6 border-b border-neutral-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">DevFlow</p>
          <h1 className="mt-1 text-2xl font-semibold">Notifications</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Updates about tasks you&rsquo;re assigned to or involved in.
          </p>
        </header>

        <NotificationList />
      </div>
    </main>
  );
}

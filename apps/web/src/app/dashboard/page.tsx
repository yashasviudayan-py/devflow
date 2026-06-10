"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, logout, type AuthUser } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    getCurrentUser()
      .then((currentUser) => {
        if (isActive) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        if (isActive) {
          router.replace("/login");
        }
      });

    return () => {
      isActive = false;
    };
  }, [router]);

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();
      setUser(null);
      router.replace("/login");
    } catch {
      setLogoutError("Logout failed. Please try again.");
      setIsLoggingOut(false);
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-500">Loading your dashboard…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <header className="flex flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              DevFlow
            </p>
            <h1 className="mt-1 text-2xl font-semibold">Dashboard</h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="self-start rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            {isLoggingOut ? "Logging out…" : "Log out"}
          </button>
        </header>

        {logoutError ? <p className="mt-4 text-sm text-red-600">{logoutError}</p> : null}

        <section className="mt-8 rounded-md border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Signed in as</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-neutral-500">Name</dt>
              <dd className="mt-1 text-base font-medium">{user.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-neutral-500">Email</dt>
              <dd className="mt-1 text-base font-medium">{user.email}</dd>
            </div>
          </dl>
        </section>

        <p className="mt-6 text-sm text-neutral-500">
          Projects and tasks will appear here in upcoming releases.
        </p>
      </div>
    </main>
  );
}

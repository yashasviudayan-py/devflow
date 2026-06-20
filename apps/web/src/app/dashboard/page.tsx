"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NotificationBell } from "@/components/NotificationBell";
import { OrganizationList } from "@/components/OrganizationList";
import {
  getStoredActiveOrganizationId,
  resolveActiveOrganization,
  setActiveOrganizationId,
} from "@/lib/activeOrganization";
import { getOrganizations, logout, type OrganizationWithRole } from "@/lib/api";
import { useRequireUser } from "@/lib/useRequireUser";

export default function DashboardPage() {
  const router = useRouter();
  const user = useRequireUser();
  const [organizations, setOrganizations] = useState<OrganizationWithRole[] | null>(null);
  const [organizationsError, setOrganizationsError] = useState<string | null>(null);
  const [activeOrganizationId, setActiveOrganizationIdState] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isActive = true;

    getOrganizations()
      .then((loaded) => {
        if (!isActive) {
          return;
        }

        setOrganizations(loaded);

        // Fall back to the first organization when the stored one no longer
        // exists (deleted, or the user was removed from it).
        const active = resolveActiveOrganization(loaded, getStoredActiveOrganizationId());
        if (active) {
          setActiveOrganizationId(active.id);
        }
        setActiveOrganizationIdState(active?.id ?? null);
      })
      .catch(() => {
        if (isActive) {
          setOrganizationsError("Could not load your organizations. Please try again.");
        }
      });

    return () => {
      isActive = false;
    };
  }, [user]);

  function handleSelectActive(organizationId: string) {
    setActiveOrganizationId(organizationId);
    setActiveOrganizationIdState(organizationId);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();
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
            <p className="mt-1 text-sm text-neutral-500">
              Signed in as {user.name} ({user.email})
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <NotificationBell />
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        </header>

        {logoutError ? <p className="mt-4 text-sm text-red-600">{logoutError}</p> : null}

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Organizations</h2>
            {organizations && organizations.length > 0 ? (
              <Link
                href="/organizations/new"
                className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-800"
              >
                New organization
              </Link>
            ) : null}
          </div>

          <div className="mt-4">
            {organizationsError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {organizationsError}
              </p>
            ) : organizations === null ? (
              <p className="text-sm text-neutral-500">Loading organizations…</p>
            ) : (
              <OrganizationList
                organizations={organizations}
                activeOrganizationId={activeOrganizationId}
                onSelectActive={handleSelectActive}
              />
            )}
          </div>
        </section>

        <p className="mt-6 text-sm text-neutral-500">
          Projects and tasks will appear here in upcoming releases.
        </p>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MemberList } from "@/components/MemberList";
import {
  clearActiveOrganizationId,
  getStoredActiveOrganizationId,
} from "@/lib/activeOrganization";
import {
  ApiError,
  getOrganization,
  getOrganizationMembers,
  type OrganizationMember,
  type OrganizationWithRole,
} from "@/lib/api";
import { useRequireUser } from "@/lib/useRequireUser";

export default function OrganizationDetailPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const user = useRequireUser();
  const [organization, setOrganization] = useState<OrganizationWithRole | null>(null);
  const [members, setMembers] = useState<OrganizationMember[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !organizationId) {
      return;
    }

    let isActive = true;

    Promise.all([getOrganization(organizationId), getOrganizationMembers(organizationId)])
      .then(([loadedOrganization, loadedMembers]) => {
        if (!isActive) {
          return;
        }

        setOrganization(loadedOrganization);
        setMembers(loadedMembers);
      })
      .catch((caught: unknown) => {
        if (!isActive) {
          return;
        }

        if (caught instanceof ApiError && caught.statusCode === 404) {
          // The API returns 404 both for missing organizations and for
          // organizations the user is not a member of.
          setNotFound(true);
          if (getStoredActiveOrganizationId() === organizationId) {
            clearActiveOrganizationId();
          }
        } else {
          setError("Could not load this organization. Please try again.");
        }
      });

    return () => {
      isActive = false;
    };
  }, [user, organizationId]);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-500">Loading…</p>
      </main>
    );
  }

  const canEdit = organization?.role === "OWNER" || organization?.role === "ADMIN";

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <Link href="/dashboard" className="text-sm font-medium text-emerald-700 hover:underline">
          ← Back to dashboard
        </Link>

        {notFound ? (
          <div className="mt-8 rounded-md border border-neutral-200 bg-white px-6 py-12 text-center">
            <h1 className="text-lg font-semibold">Organization not found</h1>
            <p className="mt-2 text-sm text-neutral-600">
              This organization does not exist or you are not a member of it.
            </p>
          </div>
        ) : error ? (
          <p className="mt-8 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : !organization ? (
          <p className="mt-8 text-sm text-neutral-500">Loading organization…</p>
        ) : (
          <>
            <header className="mt-6 flex flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold">{organization.name}</h1>
                <p className="mt-1 text-sm text-neutral-500">
                  {organization.slug} · your role:{" "}
                  <span className="font-medium text-neutral-700">{organization.role}</span>
                </p>
              </div>
              {canEdit ? (
                <button
                  type="button"
                  disabled
                  title="Editing is coming in a future release."
                  className="self-start rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-400 disabled:cursor-not-allowed sm:self-auto"
                >
                  Edit organization
                </button>
              ) : null}
            </header>

            <section className="mt-8 rounded-md border border-neutral-200 bg-white p-6">
              <h2 className="text-lg font-semibold">Members</h2>
              <div className="mt-2">
                {members === null ? (
                  <p className="text-sm text-neutral-500">Loading members…</p>
                ) : (
                  <MemberList members={members} currentUserId={user.id} />
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

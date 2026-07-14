"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppFrame, FullPageLoader } from "@/components/app/AppFrame";
import { OrganizationList } from "@/components/OrganizationList";
import { buttonClasses } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState, LoadingState } from "@/components/ui/states";
import {
  getStoredActiveOrganizationId,
  resolveActiveOrganization,
  setActiveOrganizationId,
} from "@/lib/activeOrganization";
import { getOrganizations, type OrganizationWithRole } from "@/lib/api";
import { useRequireUser } from "@/lib/useRequireUser";

export default function DashboardPage() {
  const user = useRequireUser();
  const [organizations, setOrganizations] = useState<OrganizationWithRole[] | null>(null);
  const [organizationsError, setOrganizationsError] = useState<string | null>(null);
  const [activeOrganizationId, setActiveOrganizationIdState] = useState<string | null>(null);

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

  if (!user) {
    return <FullPageLoader label="Loading your dashboard…" />;
  }

  const firstName = user.name.trim().split(/\s+/)[0] || user.name;

  return (
    <AppFrame user={user} breadcrumbs={[{ label: "Dashboard" }]}>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Pick an organization to see its projects and tasks, or create a new one."
      />

      <section className="mt-8">
        <SectionHeader
          title="Organizations"
          count={organizations !== null ? organizations.length : undefined}
          actions={
            organizations && organizations.length > 0 ? (
              <Link href="/organizations/new" className={buttonClasses("primary", "sm")}>
                <Plus aria-hidden className="h-4 w-4" strokeWidth={2} />
                New organization
              </Link>
            ) : undefined
          }
        />

        <div className="mt-4">
          {organizationsError ? (
            <ErrorState message={organizationsError} />
          ) : organizations === null ? (
            <LoadingState label="Loading organizations…" />
          ) : (
            <OrganizationList
              organizations={organizations}
              activeOrganizationId={activeOrganizationId}
              onSelectActive={handleSelectActive}
            />
          )}
        </div>
      </section>
    </AppFrame>
  );
}

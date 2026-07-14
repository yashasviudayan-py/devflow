"use client";

import type { UserRole } from "@devflow/shared";
import { SearchX } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppFrame, FullPageLoader } from "@/components/app/AppFrame";
import { MemberList } from "@/components/MemberList";
import { ProjectsSection } from "@/components/ProjectsSection";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, SectionHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
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

const roleTones: Record<UserRole, BadgeTone> = {
  OWNER: "brand",
  ADMIN: "info",
  MEMBER: "neutral",
  VIEWER: "faint",
};

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

    // Projects load independently (in ProjectsSection) so search/sort/paging
    // re-queries them without reloading the organization or its members.
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
    return <FullPageLoader />;
  }

  const canEdit = organization?.role === "OWNER" || organization?.role === "ADMIN";
  // VIEWER is read-only; everyone else may create projects (matches the API).
  const canCreateProject = organization?.role !== "VIEWER";

  return (
    <AppFrame
      user={user}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: organization ? organization.name : "Organization" },
      ]}
    >
      {notFound ? (
        <EmptyState
          variant="filtered"
          icon={SearchX}
          title="Organization not found"
          description="This organization does not exist or you are not a member of it."
        />
      ) : error ? (
        <ErrorState message={error} />
      ) : !organization ? (
        <LoadingState label="Loading organization…" />
      ) : (
        <>
          <PageHeader
            title={organization.name}
            meta={
              <>
                <Badge tone={roleTones[organization.role] ?? "neutral"}>
                  {organization.role.charAt(0) + organization.role.slice(1).toLowerCase()}
                </Badge>
                <span className="text-sm text-ink-muted">{organization.slug}</span>
              </>
            }
            actions={
              canEdit ? (
                <Button disabled title="Editing is coming in a future release.">
                  Edit organization
                </Button>
              ) : undefined
            }
          />

          <ProjectsSection organizationId={organization.id} canCreate={canCreateProject} />

          <section className="mt-10">
            <SectionHeader
              title="Members"
              count={members !== null ? members.length : undefined}
            />
            <Card className="mt-4 px-5 py-2">
              {members === null ? (
                <div className="py-3">
                  <LoadingState label="Loading members…" />
                </div>
              ) : (
                <MemberList members={members} currentUserId={user.id} />
              )}
            </Card>
          </section>
        </>
      )}
    </AppFrame>
  );
}

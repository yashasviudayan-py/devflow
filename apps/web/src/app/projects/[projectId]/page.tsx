"use client";

import { Archive, Columns3, PencilLine, SearchX } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActivitySection } from "@/components/ActivitySection";
import { AppFrame, FullPageLoader } from "@/components/app/AppFrame";
import { EditProjectForm } from "@/components/EditProjectForm";
import { TasksSection } from "@/components/TasksSection";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  ApiError,
  deleteProject,
  getOrganization,
  getOrganizationMembers,
  getProject,
  type OrganizationMember,
  type OrganizationWithRole,
  type Project,
} from "@/lib/api";
import { useRequireUser } from "@/lib/useRequireUser";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const user = useRequireUser();
  const [project, setProject] = useState<Project | null>(null);
  // We load the owning organization to show its name and to learn the caller's
  // role, since the project endpoints don't return either.
  const [organization, setOrganization] = useState<OrganizationWithRole | null>(null);
  // Members power the assignee filter (and let us show names instead of ids).
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !projectId) {
      return;
    }

    let isActive = true;

    getProject(projectId)
      .then(async (loadedProject) => {
        const [loadedOrganization, loadedMembers] = await Promise.all([
          getOrganization(loadedProject.organizationId),
          getOrganizationMembers(loadedProject.organizationId),
        ]);
        return { loadedProject, loadedOrganization, loadedMembers };
      })
      .then(({ loadedProject, loadedOrganization, loadedMembers }) => {
        if (!isActive) {
          return;
        }

        setProject(loadedProject);
        setOrganization(loadedOrganization);
        setMembers(loadedMembers);
      })
      .catch((caught: unknown) => {
        if (!isActive) {
          return;
        }

        if (caught instanceof ApiError && caught.statusCode === 404) {
          // 404 covers both missing projects and projects in organizations the
          // user is not a member of — we never leak which.
          setNotFound(true);
        } else {
          setError("Could not load this project. Please try again.");
        }
      });

    return () => {
      isActive = false;
    };
  }, [user, projectId]);

  async function handleArchive() {
    if (!project) {
      return;
    }

    if (!window.confirm(`Archive “${project.name}”? You can restore it later.`)) {
      return;
    }

    setActionError(null);
    setIsArchiving(true);

    try {
      await deleteProject(project.id);
      router.push(`/organizations/${project.organizationId}`);
    } catch (caught) {
      if (caught instanceof ApiError && caught.statusCode === 403) {
        setActionError("You do not have permission to archive this project.");
      } else if (caught instanceof ApiError) {
        setActionError(caught.message);
      } else {
        setActionError("Something went wrong. Please try again.");
      }
      setIsArchiving(false);
    }
  }

  if (!user) {
    return <FullPageLoader />;
  }

  // Only OWNER/ADMIN can edit or archive, mirroring the API authorization.
  const canManage = organization?.role === "OWNER" || organization?.role === "ADMIN";
  // VIEWER is read-only; everyone else may create tasks (matches the API).
  const canCreateTask = organization ? organization.role !== "VIEWER" : false;

  return (
    <AppFrame
      user={user}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        organization
          ? { label: organization.name, href: `/organizations/${organization.id}` }
          : { label: "Organization" },
        { label: project ? project.name : "Project" },
      ]}
    >
      {notFound ? (
        <EmptyState
          variant="filtered"
          icon={SearchX}
          title="Project not found"
          description="This project does not exist or you do not have access to it."
        />
      ) : error ? (
        <ErrorState message={error} />
      ) : !project || !organization ? (
        <LoadingState label="Loading project…" />
      ) : isEditing ? (
        <Card className="p-6">
          <h1 className="text-headline text-ink">Edit project</h1>
          <div className="mt-5">
            <EditProjectForm
              project={project}
              onCancel={() => setIsEditing(false)}
              onSaved={(updated) => {
                setProject(updated);
                setIsEditing(false);
              }}
            />
          </div>
        </Card>
      ) : (
        <>
          <PageHeader
            title={project.name}
            actions={
              <>
                <Link href={`/projects/${project.id}/board`} className={buttonClasses("secondary")}>
                  <Columns3 aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                  Board
                </Link>
                {canManage ? (
                  <>
                    <Button
                      onClick={() => {
                        setActionError(null);
                        setIsEditing(true);
                      }}
                    >
                      <PencilLine aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={handleArchive} isLoading={isArchiving}>
                      <Archive aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                      {isArchiving ? "Archiving…" : "Archive"}
                    </Button>
                  </>
                ) : null}
              </>
            }
          />

          {actionError ? (
            <div className="mt-4">
              <ErrorState message={actionError} />
            </div>
          ) : null}

          <Card className="mt-6 p-6">
            <h2 className="text-sm font-semibold text-ink-secondary">Description</h2>
            {project.description ? (
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink-secondary">
                {project.description}
              </p>
            ) : (
              <p className="mt-2 text-sm text-ink-faint">No description provided.</p>
            )}

            <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-edge-subtle pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-ink-muted">Created</dt>
                <dd className="mt-0.5 tabular-nums text-ink">{formatDateTime(project.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Last updated</dt>
                <dd className="mt-0.5 tabular-nums text-ink">{formatDateTime(project.updatedAt)}</dd>
              </div>
            </dl>
          </Card>

          <TasksSection projectId={project.id} canCreate={canCreateTask} members={members} />

          <ActivitySection source="project" id={project.id} members={members} />
        </>
      )}
    </AppFrame>
  );
}

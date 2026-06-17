"use client";

import type { TaskFilterInput } from "@devflow/shared";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EditProjectForm } from "@/components/EditProjectForm";
import { TaskFilters } from "@/components/TaskFilters";
import { EmptyTasksState, TaskList } from "@/components/TaskList";
import {
  ApiError,
  deleteProject,
  getOrganization,
  getOrganizationMembers,
  getProject,
  getProjectTasks,
  type OrganizationMember,
  type OrganizationWithRole,
  type Project,
  type Task,
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
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilterInput>({});
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

  // Tasks are fetched separately so changing a filter re-queries the API
  // (which does the filtering) without reloading the rest of the page.
  useEffect(() => {
    if (!user || !projectId) {
      return;
    }

    let isActive = true;
    setTasksError(null);

    getProjectTasks(projectId, filters)
      .then((loadedTasks) => {
        if (isActive) {
          setTasks(loadedTasks);
        }
      })
      .catch(() => {
        if (isActive) {
          setTasksError("Could not load tasks. Please try again.");
        }
      });

    return () => {
      isActive = false;
    };
  }, [user, projectId, filters]);

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
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-500">Loading…</p>
      </main>
    );
  }

  // Only OWNER/ADMIN can edit or archive, mirroring the API authorization.
  const canManage = organization?.role === "OWNER" || organization?.role === "ADMIN";
  // VIEWER is read-only; everyone else may create tasks (matches the API).
  const canCreateTask = organization ? organization.role !== "VIEWER" : false;
  const isFiltered = Boolean(filters.status || filters.priority || filters.assigneeId);

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <Link
          href={project ? `/organizations/${project.organizationId}` : "/dashboard"}
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          ← Back to organization
        </Link>

        {notFound ? (
          <div className="mt-8 rounded-md border border-neutral-200 bg-white px-6 py-12 text-center">
            <h1 className="text-lg font-semibold">Project not found</h1>
            <p className="mt-2 text-sm text-neutral-600">
              This project does not exist or you do not have access to it.
            </p>
          </div>
        ) : error ? (
          <p className="mt-8 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : !project || !organization ? (
          <p className="mt-8 text-sm text-neutral-500">Loading project…</p>
        ) : isEditing ? (
          <section className="mt-6 rounded-md border border-neutral-200 bg-white p-6">
            <h1 className="text-lg font-semibold">Edit project</h1>
            <div className="mt-4">
              <EditProjectForm
                project={project}
                onCancel={() => setIsEditing(false)}
                onSaved={(updated) => {
                  setProject(updated);
                  setIsEditing(false);
                }}
              />
            </div>
          </section>
        ) : (
          <>
            <header className="mt-6 flex flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm text-neutral-500">
                  <Link
                    href={`/organizations/${organization.id}`}
                    className="font-medium text-neutral-700 hover:underline"
                  >
                    {organization.name}
                  </Link>
                </p>
                <h1 className="mt-1 text-2xl font-semibold">{project.name}</h1>
              </div>

              {canManage ? (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActionError(null);
                      setIsEditing(true);
                    }}
                    className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleArchive}
                    disabled={isArchiving}
                    className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isArchiving ? "Archiving…" : "Archive"}
                  </button>
                </div>
              ) : null}
            </header>

            {actionError ? (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {actionError}
              </p>
            ) : null}

            <section className="mt-6 rounded-md border border-neutral-200 bg-white p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Description
              </h2>
              {project.description ? (
                <p className="mt-2 whitespace-pre-line text-sm text-neutral-800">
                  {project.description}
                </p>
              ) : (
                <p className="mt-2 text-sm italic text-neutral-400">No description provided.</p>
              )}

              <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-neutral-200 pt-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-neutral-500">Created</dt>
                  <dd className="mt-0.5 text-neutral-800">{formatDateTime(project.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Last updated</dt>
                  <dd className="mt-0.5 text-neutral-800">{formatDateTime(project.updatedAt)}</dd>
                </div>
              </dl>
            </section>

            <section className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Tasks</h2>
                <div className="flex items-center gap-2">
                  {tasks && tasks.length > 0 ? (
                    <Link
                      href={`/projects/${project.id}/board`}
                      className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                    >
                      Board view
                    </Link>
                  ) : null}
                  {canCreateTask && tasks && tasks.length > 0 ? (
                    <Link
                      href={`/projects/${project.id}/tasks/new`}
                      className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-800"
                    >
                      New task
                    </Link>
                  ) : null}
                </div>
              </div>

              {/* Filters only help once there is something to filter. */}
              {tasks && (tasks.length > 0 || isFiltered) ? (
                <div className="mt-4">
                  <TaskFilters filters={filters} members={members} onChange={setFilters} />
                </div>
              ) : null}

              <div className="mt-4">
                {tasksError ? (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {tasksError}
                  </p>
                ) : tasks === null ? (
                  <p className="text-sm text-neutral-500">Loading tasks…</p>
                ) : tasks.length === 0 ? (
                  <EmptyTasksState
                    projectId={project.id}
                    canCreate={canCreateTask}
                    isFiltered={isFiltered}
                  />
                ) : (
                  <TaskList tasks={tasks} />
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

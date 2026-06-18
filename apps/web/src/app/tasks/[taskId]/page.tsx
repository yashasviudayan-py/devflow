"use client";

import type { UserRole } from "@devflow/shared";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CommentsSection } from "@/components/CommentsSection";
import { EditTaskForm } from "@/components/EditTaskForm";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/TaskBadges";
import {
  ApiError,
  deleteTask,
  getOrganization,
  getOrganizationMembers,
  getProject,
  getTask,
  type OrganizationMember,
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const router = useRouter();
  const user = useRequireUser();
  const [task, setTask] = useState<Task | null>(null);
  // The task endpoints don't return the caller's role or the org members, so we
  // resolve them via the owning project (task → project → organization).
  const [role, setRole] = useState<UserRole | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !taskId) {
      return;
    }

    let isActive = true;

    getTask(taskId)
      .then(async (loadedTask) => {
        const project = await getProject(loadedTask.projectId);
        const [organization, loadedMembers] = await Promise.all([
          getOrganization(project.organizationId),
          getOrganizationMembers(project.organizationId),
        ]);
        return { loadedTask, organization, loadedMembers };
      })
      .then(({ loadedTask, organization, loadedMembers }) => {
        if (!isActive) {
          return;
        }

        setTask(loadedTask);
        setRole(organization.role);
        setMembers(loadedMembers);
      })
      .catch((caught: unknown) => {
        if (!isActive) {
          return;
        }

        if (caught instanceof ApiError && caught.statusCode === 404) {
          // 404 covers both missing tasks and tasks in organizations the user is
          // not a member of — we never leak which.
          setNotFound(true);
        } else {
          setError("Could not load this task. Please try again.");
        }
      });

    return () => {
      isActive = false;
    };
  }, [user, taskId]);

  async function handleArchive() {
    if (!task) {
      return;
    }

    if (!window.confirm(`Archive “${task.title}”? You can restore it later.`)) {
      return;
    }

    setActionError(null);
    setIsArchiving(true);

    try {
      await deleteTask(task.id);
      router.push(`/projects/${task.projectId}`);
    } catch (caught) {
      if (caught instanceof ApiError && caught.statusCode === 403) {
        setActionError("You do not have permission to archive this task.");
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

  // Only OWNER/ADMIN/MEMBER may edit or archive; VIEWER is read-only (matches the API).
  const canManage = role === "OWNER" || role === "ADMIN" || role === "MEMBER";

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <Link
          href={task ? `/projects/${task.projectId}` : "/dashboard"}
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          ← Back to project
        </Link>

        {notFound ? (
          <div className="mt-8 rounded-md border border-neutral-200 bg-white px-6 py-12 text-center">
            <h1 className="text-lg font-semibold">Task not found</h1>
            <p className="mt-2 text-sm text-neutral-600">
              This task does not exist or you do not have access to it.
            </p>
          </div>
        ) : error ? (
          <p className="mt-8 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : !task ? (
          <p className="mt-8 text-sm text-neutral-500">Loading task…</p>
        ) : isEditing ? (
          <section className="mt-6 rounded-md border border-neutral-200 bg-white p-6">
            <h1 className="text-lg font-semibold">Edit task</h1>
            <div className="mt-4">
              <EditTaskForm
                task={task}
                members={members}
                onCancel={() => setIsEditing(false)}
                onSaved={(updated) => {
                  setTask(updated);
                  setIsEditing(false);
                }}
              />
            </div>
          </section>
        ) : (
          <>
            <header className="mt-6 flex flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <TaskStatusBadge status={task.status} />
                  <TaskPriorityBadge priority={task.priority} />
                </div>
                <h1 className="mt-2 text-2xl font-semibold">{task.title}</h1>
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
              {task.description ? (
                <p className="mt-2 whitespace-pre-line text-sm text-neutral-800">
                  {task.description}
                </p>
              ) : (
                <p className="mt-2 text-sm italic text-neutral-400">No description provided.</p>
              )}

              <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-neutral-200 pt-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-neutral-500">Assignee</dt>
                  <dd className="mt-0.5 text-neutral-800">
                    {task.assignee ? task.assignee.name : "Unassigned"}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Created by</dt>
                  <dd className="mt-0.5 text-neutral-800">
                    {task.reporter ? task.reporter.name : "Unknown"}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Due date</dt>
                  <dd className="mt-0.5 text-neutral-800">
                    {task.dueDate ? formatDate(task.dueDate) : "None"}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Created</dt>
                  <dd className="mt-0.5 text-neutral-800">{formatDateTime(task.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Last updated</dt>
                  <dd className="mt-0.5 text-neutral-800">{formatDateTime(task.updatedAt)}</dd>
                </div>
              </dl>
            </section>

            <CommentsSection
              taskId={task.id}
              currentUserId={user.id}
              role={role}
              canComment={canManage}
            />
          </>
        )}
      </div>
    </main>
  );
}

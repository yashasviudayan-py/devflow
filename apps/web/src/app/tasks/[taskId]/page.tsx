"use client";

import type { UserRole } from "@devflow/shared";
import { Archive, PencilLine, SearchX } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActivitySection } from "@/components/ActivitySection";
import { AppFrame, FullPageLoader } from "@/components/app/AppFrame";
import { CommentsSection } from "@/components/CommentsSection";
import { EditTaskForm } from "@/components/EditTaskForm";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/TaskBadges";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
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
  // resolve them via the owning project (task → project → organization). The
  // project name is kept for the breadcrumb — no extra request needed.
  const [projectName, setProjectName] = useState<string | null>(null);
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
        return { loadedTask, project, organization, loadedMembers };
      })
      .then(({ loadedTask, project, organization, loadedMembers }) => {
        if (!isActive) {
          return;
        }

        setTask(loadedTask);
        setProjectName(project.name);
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
    return <FullPageLoader />;
  }

  // Only OWNER/ADMIN/MEMBER may edit or archive; VIEWER is read-only (matches the API).
  const canManage = role === "OWNER" || role === "ADMIN" || role === "MEMBER";

  return (
    <AppFrame
      user={user}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        task
          ? { label: projectName ?? "Project", href: `/projects/${task.projectId}` }
          : { label: "Project" },
        { label: task ? task.title : "Task" },
      ]}
    >
      {notFound ? (
        <EmptyState
          variant="filtered"
          icon={SearchX}
          title="Task not found"
          description="This task does not exist or you do not have access to it."
        />
      ) : error ? (
        <ErrorState message={error} />
      ) : !task ? (
        <LoadingState label="Loading task…" />
      ) : isEditing ? (
        <Card className="p-6">
          <h1 className="text-headline text-ink">Edit task</h1>
          <div className="mt-5">
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
        </Card>
      ) : (
        <>
          <PageHeader
            title={task.title}
            meta={
              <>
                <TaskStatusBadge status={task.status} />
                <TaskPriorityBadge priority={task.priority} />
              </>
            }
            actions={
              canManage ? (
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
              ) : undefined
            }
          />

          {actionError ? (
            <div className="mt-4">
              <ErrorState message={actionError} />
            </div>
          ) : null}

          <Card className="mt-6 p-6">
            <h2 className="text-sm font-semibold text-ink-secondary">Details</h2>
            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-ink-muted">Assignee</dt>
                <dd className="mt-1 flex items-center gap-2 text-ink">
                  {task.assignee ? (
                    <>
                      <Avatar name={task.assignee.name} size="sm" />
                      {task.assignee.name}
                    </>
                  ) : (
                    <span className="text-ink-faint">Unassigned</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Created by</dt>
                <dd className="mt-1 flex items-center gap-2 text-ink">
                  {task.reporter ? (
                    <>
                      <Avatar name={task.reporter.name} size="sm" />
                      {task.reporter.name}
                    </>
                  ) : (
                    "Unknown"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Due date</dt>
                <dd className="mt-1 tabular-nums text-ink">
                  {task.dueDate ? formatDate(task.dueDate) : "None"}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Created</dt>
                <dd className="mt-1 tabular-nums text-ink">{formatDateTime(task.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Last updated</dt>
                <dd className="mt-1 tabular-nums text-ink">{formatDateTime(task.updatedAt)}</dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-edge-subtle pt-5">
              <h2 className="text-sm font-semibold text-ink-secondary">Description</h2>
              {task.description ? (
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink-secondary">
                  {task.description}
                </p>
              ) : (
                <p className="mt-2 text-sm text-ink-faint">No description provided.</p>
              )}
            </div>
          </Card>

          <CommentsSection
            taskId={task.id}
            currentUserId={user.id}
            role={role}
            canComment={canManage}
          />

          <ActivitySection source="task" id={task.id} members={members} />
        </>
      )}
    </AppFrame>
  );
}

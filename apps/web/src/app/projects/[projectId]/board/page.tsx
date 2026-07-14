"use client";

import type { TaskStatus } from "@devflow/shared";
import { Plus, SearchX } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppFrame, FullPageLoader } from "@/components/app/AppFrame";
import { KanbanBoard } from "@/components/KanbanBoard";
import { buttonClasses } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  ApiError,
  getOrganization,
  getProject,
  getProjectTasks,
  updateTaskStatus,
  type OrganizationWithRole,
  type Project,
  type Task,
} from "@/lib/api";
import type { BoardStatus } from "@/lib/kanban";
import { useRequireUser } from "@/lib/useRequireUser";

export default function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const user = useRequireUser();
  const [project, setProject] = useState<Project | null>(null);
  // The project endpoints don't return the caller's role, so we load the owning
  // organization to learn whether the user may move tasks (mirrors the project page).
  const [organization, setOrganization] = useState<OrganizationWithRole | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  // Tasks whose status change is in flight, so their controls can be disabled.
  const [movingTaskIds, setMovingTaskIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !projectId) {
      return;
    }

    let isActive = true;

    getProject(projectId)
      .then(async (loadedProject) => {
        const loadedOrganization = await getOrganization(loadedProject.organizationId);
        return { loadedProject, loadedOrganization };
      })
      .then(({ loadedProject, loadedOrganization }) => {
        if (!isActive) {
          return;
        }

        setProject(loadedProject);
        setOrganization(loadedOrganization);
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
          setError("Could not load this board. Please try again.");
        }
      });

    return () => {
      isActive = false;
    };
  }, [user, projectId]);

  useEffect(() => {
    if (!user || !projectId) {
      return;
    }

    let isActive = true;
    setTasksError(null);

    // The board groups every task by status, so paging it would be confusing. We
    // fetch a single large page (the API's max limit) instead of the default 20;
    // a project with more than 100 tasks would show only the first 100, which is
    // acceptable until board-level pagination/virtualization is needed.
    getProjectTasks(projectId, { limit: 100 })
      .then((page) => {
        if (isActive) {
          setTasks(page.tasks);
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
  }, [user, projectId]);

  async function handleMove(taskId: string, nextStatus: BoardStatus) {
    if (!tasks) {
      return;
    }

    const target = tasks.find((task) => task.id === taskId);
    if (!target || target.status === nextStatus) {
      return;
    }

    const previousStatus: TaskStatus = target.status;
    setMoveError(null);

    // Optimistically move the card to the new column straight away.
    setTasks((current) =>
      current
        ? current.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task))
        : current,
    );
    setMovingTaskIds((current) => new Set(current).add(taskId));

    try {
      const updated = await updateTaskStatus(taskId, nextStatus);
      // Reconcile with the server's copy (e.g. updatedAt) on success.
      setTasks((current) =>
        current ? current.map((task) => (task.id === taskId ? updated : task)) : current,
      );
    } catch (caught) {
      // Roll back just this task to its previous status, leaving any other
      // in-flight moves untouched.
      setTasks((current) =>
        current
          ? current.map((task) =>
              task.id === taskId ? { ...task, status: previousStatus } : task,
            )
          : current,
      );

      if (caught instanceof ApiError && caught.statusCode === 401) {
        // Session expired — send the user back to log in.
        router.replace("/login");
        return;
      }

      if (caught instanceof ApiError && caught.statusCode === 403) {
        setMoveError("You do not have permission to move this task.");
      } else if (caught instanceof ApiError && caught.statusCode === 404) {
        setMoveError("This task no longer exists. Refresh to see the latest board.");
      } else {
        setMoveError("Could not move the task. Please try again.");
      }
    } finally {
      setMovingTaskIds((current) => {
        const next = new Set(current);
        next.delete(taskId);
        return next;
      });
    }
  }

  if (!user) {
    return <FullPageLoader />;
  }

  // VIEWER is read-only; everyone else may move tasks (matches the PATCH /tasks API).
  const canManage = organization ? organization.role !== "VIEWER" : false;

  return (
    <AppFrame
      user={user}
      width="wide"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        project
          ? { label: project.name, href: `/projects/${project.id}` }
          : { label: "Project" },
        { label: "Board" },
      ]}
    >
      {notFound ? (
        <EmptyState
          variant="filtered"
          icon={SearchX}
          title="Board not found"
          description="This project does not exist or you do not have access to it."
        />
      ) : error ? (
        <ErrorState message={error} />
      ) : !project ? (
        <LoadingState label="Loading board…" />
      ) : (
        <>
          <PageHeader
            eyebrow={project.name}
            title="Board"
            actions={
              canManage ? (
                <Link
                  href={`/projects/${project.id}/tasks/new`}
                  className={buttonClasses("primary")}
                >
                  <Plus aria-hidden className="h-4 w-4" strokeWidth={2} />
                  New task
                </Link>
              ) : undefined
            }
          />

          {moveError ? (
            <div className="mt-4" aria-live="polite">
              <ErrorState message={moveError} />
            </div>
          ) : null}

          <div className="mt-6">
            {tasksError ? (
              <ErrorState message={tasksError} />
            ) : tasks === null ? (
              <LoadingState label="Loading tasks…" />
            ) : tasks.length === 0 ? (
              <EmptyState
                title="No tasks yet"
                description="Tasks you create will appear on this board, grouped by status."
                action={
                  canManage ? (
                    <Link
                      href={`/projects/${project.id}/tasks/new`}
                      className={buttonClasses("primary")}
                    >
                      Create task
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <KanbanBoard
                tasks={tasks}
                canManage={canManage}
                movingTaskIds={movingTaskIds}
                onMove={handleMove}
              />
            )}
          </div>
        </>
      )}
    </AppFrame>
  );
}

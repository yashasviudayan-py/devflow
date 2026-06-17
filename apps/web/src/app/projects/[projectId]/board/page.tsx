"use client";

import type { TaskStatus } from "@devflow/shared";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
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

    // The board shows the first page of tasks (the list endpoint is paginated,
    // default 20), matching the project task list. Pagination is out of scope here.
    getProjectTasks(projectId)
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
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-500">Loading…</p>
      </main>
    );
  }

  // VIEWER is read-only; everyone else may move tasks (matches the PATCH /tasks API).
  const canManage = organization ? organization.role !== "VIEWER" : false;

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          ← Back to project
        </Link>

        {notFound ? (
          <div className="mt-8 rounded-md border border-neutral-200 bg-white px-6 py-12 text-center">
            <h1 className="text-lg font-semibold">Board not found</h1>
            <p className="mt-2 text-sm text-neutral-600">
              This project does not exist or you do not have access to it.
            </p>
          </div>
        ) : error ? (
          <p className="mt-8 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : !project ? (
          <p className="mt-8 text-sm text-neutral-500">Loading board…</p>
        ) : (
          <>
            <header className="mt-6 flex flex-col gap-2 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm text-neutral-500">{project.name}</p>
                <h1 className="mt-1 text-2xl font-semibold">Board</h1>
              </div>
              {canManage ? (
                <Link
                  href={`/projects/${project.id}/tasks/new`}
                  className="shrink-0 rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-800"
                >
                  New task
                </Link>
              ) : null}
            </header>

            {moveError ? (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {moveError}
              </p>
            ) : null}

            <div className="mt-6">
              {tasksError ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {tasksError}
                </p>
              ) : tasks === null ? (
                <p className="text-sm text-neutral-500">Loading tasks…</p>
              ) : tasks.length === 0 ? (
                <div className="rounded-md border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
                  <h3 className="text-base font-semibold text-neutral-950">No tasks yet</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
                    Tasks you create will appear on this board, grouped by status.
                  </p>
                  {canManage ? (
                    <Link
                      href={`/projects/${project.id}/tasks/new`}
                      className="mt-6 inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
                    >
                      Create task
                    </Link>
                  ) : null}
                </div>
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
      </div>
    </main>
  );
}

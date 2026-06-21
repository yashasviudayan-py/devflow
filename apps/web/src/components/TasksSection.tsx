"use client";

import { taskPriorities, taskSortFields, taskStatuses } from "@devflow/shared";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyFilteredState } from "@/components/EmptyFilteredState";
import { PaginationControls } from "@/components/PaginationControls";
import { SearchInput } from "@/components/SearchInput";
import { SortControls } from "@/components/SortControls";
import { TaskFilters, type TaskFiltersValue } from "@/components/TaskFilters";
import { EmptyTasksState, TaskList } from "@/components/TaskList";
import { getProjectTasks, type OrganizationMember, type Task } from "@/lib/api";
import { taskSortOptions } from "@/lib/listOptions";
import {
  mergeSearchParams,
  parseEnumParam,
  parsePageSize,
  parseSortOrder,
  type QueryUpdates,
} from "@/lib/listQuery";
import { useCursorPagination } from "@/lib/useCursorPagination";

type TasksSectionProps = {
  projectId: string;
  canCreate: boolean;
  members: OrganizationMember[];
};

/**
 * Search + filter + sort + cursor pagination for a project's tasks. Filter state
 * lives in the URL (shareable, refresh-safe); the page position is local, so a
 * refresh restarts at page 1 with filters intact. The API does the filtering, so
 * a query change just re-fetches page 1.
 */
export function TasksSection({ projectId, canCreate, members }: TasksSectionProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const q = searchParams.get("q") ?? "";
  const status = parseEnumParam(searchParams.get("status"), taskStatuses);
  const priority = parseEnumParam(searchParams.get("priority"), taskPriorities);
  const assigneeId = searchParams.get("assigneeId") || undefined;
  const unassigned = searchParams.get("unassigned") === "true";
  const dueAfter = searchParams.get("dueAfter") || undefined;
  const dueBefore = searchParams.get("dueBefore") || undefined;
  const sortBy = parseEnumParam(searchParams.get("sortBy"), taskSortFields);
  const sortOrder = parseSortOrder(searchParams.get("sortOrder"));
  const pageSize = parsePageSize(searchParams.get("limit"));

  const filterKey = JSON.stringify({
    q,
    status,
    priority,
    assigneeId,
    unassigned,
    dueAfter,
    dueBefore,
    sortBy,
    sortOrder,
    pageSize,
  });

  const { cursor, pageIndex, hasPrev, goNext, goPrev } = useCursorPagination(filterKey);

  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setError(null);

    getProjectTasks(projectId, {
      q: q || undefined,
      status,
      priority,
      assigneeId,
      unassigned: unassigned || undefined,
      dueAfter,
      dueBefore,
      sortBy,
      sortOrder,
      limit: pageSize,
      cursor,
    })
      .then((page) => {
        if (!isActive) {
          return;
        }
        setTasks(page.tasks);
        setNextCursor(page.nextCursor);
      })
      .catch(() => {
        if (isActive) {
          setError("Could not load tasks. Please try again.");
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    projectId,
    q,
    status,
    priority,
    assigneeId,
    unassigned,
    dueAfter,
    dueBefore,
    sortBy,
    sortOrder,
    pageSize,
    cursor,
  ]);

  function applyParams(updates: QueryUpdates) {
    const query = mergeSearchParams(searchParams, updates);
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleFiltersChange(next: TaskFiltersValue) {
    applyParams({
      status: next.status,
      priority: next.priority,
      assigneeId: next.assigneeId,
      unassigned: next.unassigned ? "true" : undefined,
      dueAfter: next.dueAfter,
      dueBefore: next.dueBefore,
    });
  }

  function resetAll() {
    // Drop every list param at once; leaves any unrelated params untouched.
    applyParams({
      q: undefined,
      status: undefined,
      priority: undefined,
      assigneeId: undefined,
      unassigned: undefined,
      dueAfter: undefined,
      dueBefore: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      limit: undefined,
    });
  }

  const isFiltered = Boolean(
    q || status || priority || assigneeId || unassigned || dueAfter || dueBefore,
  );
  const filtersValue: TaskFiltersValue = {
    status,
    priority,
    assigneeId,
    unassigned: unassigned || undefined,
    dueAfter,
    dueBefore,
  };

  const hasTasks = tasks !== null && tasks.length > 0;
  const showContext = tasks !== null && (hasTasks || isFiltered);
  const showPagination = tasks !== null && (hasTasks || pageIndex > 0);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tasks</h2>
        {showContext ? (
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${projectId}/board`}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              Board view
            </Link>
            {canCreate ? (
              <Link
                href={`/projects/${projectId}/tasks/new`}
                className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-800"
              >
                New task
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      {showContext ? (
        <div className="mt-4 flex flex-col gap-3">
          <SearchInput
            value={q}
            onChange={(value) => applyParams({ q: value || undefined })}
            placeholder="Search tasks…"
            label="Search"
          />
          <TaskFilters value={filtersValue} members={members} onChange={handleFiltersChange} />
          <div className="flex items-end justify-between gap-2">
            <SortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              options={taskSortOptions}
              onChange={(next) => applyParams({ sortBy: next.sortBy, sortOrder: next.sortOrder })}
            />
            {isFiltered ? (
              <button
                type="button"
                onClick={resetAll}
                className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
              >
                Reset filters
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : tasks === null ? (
          <p className="text-sm text-neutral-500">Loading tasks…</p>
        ) : tasks.length === 0 ? (
          isFiltered ? (
            <EmptyFilteredState noun="tasks" onReset={resetAll} />
          ) : (
            <EmptyTasksState projectId={projectId} canCreate={canCreate} />
          )
        ) : (
          <TaskList tasks={tasks} />
        )}
      </div>

      {showPagination ? (
        <div className="mt-4">
          <PaginationControls
            pageIndex={pageIndex}
            hasPrev={hasPrev}
            hasNext={nextCursor !== null}
            pageSize={pageSize}
            isLoading={tasks === null}
            onPrev={goPrev}
            onNext={() => goNext(nextCursor)}
            onPageSizeChange={(size) => applyParams({ limit: size })}
          />
        </div>
      ) : null}
    </section>
  );
}

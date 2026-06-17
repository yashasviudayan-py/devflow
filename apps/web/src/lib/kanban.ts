import type { TaskStatus } from "@devflow/shared";
import type { Task } from "@/lib/api";

// The board surfaces the four active workflow statuses as columns, with
// user-friendly labels. CANCELED exists in the TaskStatus enum but has no
// column — those tasks are treated as out-of-board work (see groupTasksByStatus).
export const boardColumns = [
  { status: "TODO", label: "Todo" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "IN_REVIEW", label: "In Review" },
  { status: "DONE", label: "Done" },
] as const satisfies ReadonlyArray<{ status: TaskStatus; label: string }>;

export type BoardStatus = (typeof boardColumns)[number]["status"];

const boardStatuses = new Set<TaskStatus>(boardColumns.map((column) => column.status));

export function isBoardStatus(status: TaskStatus): status is BoardStatus {
  return boardStatuses.has(status);
}

/**
 * Groups tasks into the four board columns, preserving input order within each
 * column. Tasks whose status has no column (CANCELED) are intentionally omitted
 * so the board only shows active work.
 */
export function groupTasksByStatus(tasks: Task[]): Record<BoardStatus, Task[]> {
  const grouped: Record<BoardStatus, Task[]> = {
    TODO: [],
    IN_PROGRESS: [],
    IN_REVIEW: [],
    DONE: [],
  };

  for (const task of tasks) {
    if (isBoardStatus(task.status)) {
      grouped[task.status].push(task);
    }
  }

  return grouped;
}

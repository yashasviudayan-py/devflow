import Link from "next/link";
import { TaskPriorityBadge } from "@/components/TaskBadges";
import type { Task } from "@/lib/api";
import { boardColumns, type BoardStatus } from "@/lib/kanban";

type KanbanTaskCardProps = {
  task: Task;
  // OWNER/ADMIN/MEMBER may move tasks; VIEWER sees a read-only card (matches the API).
  canManage: boolean;
  // True while this card's status change is in flight, to disable the control.
  isMoving: boolean;
  onMove: (taskId: string, status: BoardStatus) => void;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function KanbanTaskCard({ task, canManage, isMoving, onMove }: KanbanTaskCardProps) {
  return (
    <li
      aria-busy={isMoving}
      className={`rounded-md border border-neutral-200 bg-white p-3 shadow-sm transition ${
        isMoving ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/tasks/${task.id}`}
          className="min-w-0 break-words text-sm font-semibold text-neutral-950 hover:underline"
        >
          {task.title}
        </Link>
        <TaskPriorityBadge priority={task.priority} />
      </div>

      <p className="mt-2 text-xs text-neutral-500">
        {task.assignee ? task.assignee.name : "Unassigned"}
        {task.dueDate ? ` · Due ${formatDate(task.dueDate)}` : ""}
      </p>

      {canManage ? (
        <div className="mt-3">
          <label htmlFor={`move-${task.id}`} className="sr-only">
            Move task to a different status
          </label>
          {/* The select reflects the current column; choosing another moves the
              task. A plain dropdown keeps this accessible and works on mobile,
              avoiding a drag-and-drop dependency. */}
          <select
            id={`move-${task.id}`}
            value={task.status}
            disabled={isMoving}
            onChange={(event) => onMove(task.id, event.target.value as BoardStatus)}
            className="block w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-700 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {boardColumns.map((column) => (
              <option key={column.status} value={column.status}>
                {column.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </li>
  );
}

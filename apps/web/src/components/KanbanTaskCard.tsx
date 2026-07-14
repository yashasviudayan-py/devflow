import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { TaskPriorityBadge } from "@/components/TaskBadges";
import { Avatar } from "@/components/ui/Avatar";
import { Select } from "@/components/ui/fields";
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

// A task is overdue when its due date has passed and it isn't finished. Due
// dates are stored as midnight-UTC timestamps, so compare against today's date
// rather than the current instant.
function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === "DONE") {
    return false;
  }
  const due = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

export function KanbanTaskCard({ task, canManage, isMoving, onMove }: KanbanTaskCardProps) {
  const overdue = isOverdue(task);

  return (
    <li
      aria-busy={isMoving}
      className={`rounded-[10px] border border-edge-subtle bg-surface p-3 transition ${
        isMoving ? "opacity-60" : "hover:border-edge hover:shadow-raised"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/tasks/${task.id}`}
          className="focus-ring min-w-0 break-words rounded text-sm font-semibold leading-5 text-ink hover:text-brand-800"
        >
          {task.title}
        </Link>
        <TaskPriorityBadge priority={task.priority} />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-muted">
        {task.assignee ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <Avatar name={task.assignee.name} size="sm" />
            <span className="truncate">{task.assignee.name}</span>
          </span>
        ) : (
          <span className="text-ink-faint">Unassigned</span>
        )}
        {task.dueDate ? (
          <span
            className={`flex items-center gap-1 tabular-nums ${
              overdue ? "font-medium text-red-600" : ""
            }`}
          >
            <CalendarDays aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
            {formatDate(task.dueDate)}
            {overdue ? " · Overdue" : ""}
          </span>
        ) : null}
      </div>

      {canManage ? (
        <div className="mt-3">
          <label htmlFor={`move-${task.id}`} className="sr-only">
            Move task to a different status
          </label>
          {/* The select reflects the current column; choosing another moves the
              task. A plain dropdown keeps this accessible and works on mobile,
              avoiding a drag-and-drop dependency. */}
          <Select
            id={`move-${task.id}`}
            value={task.status}
            disabled={isMoving}
            onChange={(event) => onMove(task.id, event.target.value as BoardStatus)}
            className="rounded-lg px-2 py-1 text-xs text-ink-secondary"
          >
            {boardColumns.map((column) => (
              <option key={column.status} value={column.status}>
                {column.label}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
    </li>
  );
}

import { KanbanTaskCard } from "@/components/KanbanTaskCard";
import { statusDotClasses } from "@/components/TaskBadges";
import type { Task } from "@/lib/api";
import type { BoardStatus } from "@/lib/kanban";

type KanbanColumnProps = {
  status: BoardStatus;
  label: string;
  tasks: Task[];
  canManage: boolean;
  movingTaskIds: Set<string>;
  onMove: (taskId: string, status: BoardStatus) => void;
};

export function KanbanColumn({
  status,
  label,
  tasks,
  canManage,
  movingTaskIds,
  onMove,
}: KanbanColumnProps) {
  return (
    <section
      aria-label={`${label} column`}
      className="flex w-full flex-col rounded-card border border-edge-subtle bg-canvas-subtle p-3 sm:w-[290px] sm:shrink-0"
    >
      <header className="flex items-center justify-between px-1.5 pb-3 pt-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-secondary">
          <span aria-hidden className={`h-2 w-2 rounded-full ${statusDotClasses[status]}`} />
          {label}
        </h2>
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium tabular-nums text-ink-muted ring-1 ring-edge-subtle">
          {tasks.length}
        </span>
      </header>

      {tasks.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-edge-strong px-3 py-8 text-center text-xs text-ink-faint">
          No tasks
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {tasks.map((task) => (
            <KanbanTaskCard
              key={task.id}
              task={task}
              canManage={canManage}
              isMoving={movingTaskIds.has(task.id)}
              onMove={onMove}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

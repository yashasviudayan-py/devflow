import { KanbanTaskCard } from "@/components/KanbanTaskCard";
import type { Task } from "@/lib/api";
import type { BoardStatus } from "@/lib/kanban";

type KanbanColumnProps = {
  label: string;
  tasks: Task[];
  canManage: boolean;
  movingTaskIds: Set<string>;
  onMove: (taskId: string, status: BoardStatus) => void;
};

export function KanbanColumn({
  label,
  tasks,
  canManage,
  movingTaskIds,
  onMove,
}: KanbanColumnProps) {
  return (
    <section className="flex w-full flex-col rounded-lg border border-neutral-200 bg-neutral-100/70 p-3 sm:w-72 sm:shrink-0">
      <header className="flex items-center justify-between px-1 pb-3">
        <h2 className="text-sm font-semibold text-neutral-700">{label}</h2>
        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
          {tasks.length}
        </span>
      </header>

      {tasks.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-300 px-3 py-6 text-center text-xs text-neutral-400">
          No tasks
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
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

import { KanbanColumn } from "@/components/KanbanColumn";
import type { Task } from "@/lib/api";
import { boardColumns, groupTasksByStatus, type BoardStatus } from "@/lib/kanban";

type KanbanBoardProps = {
  tasks: Task[];
  canManage: boolean;
  movingTaskIds: Set<string>;
  onMove: (taskId: string, status: BoardStatus) => void;
};

export function KanbanBoard({ tasks, canManage, movingTaskIds, onMove }: KanbanBoardProps) {
  const grouped = groupTasksByStatus(tasks);

  // Columns sit side by side on desktop (horizontal scroll if needed) and stack
  // vertically on small screens for readability.
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:overflow-x-auto sm:pb-2">
      {boardColumns.map((column) => (
        <KanbanColumn
          key={column.status}
          label={column.label}
          tasks={grouped[column.status]}
          canManage={canManage}
          movingTaskIds={movingTaskIds}
          onMove={onMove}
        />
      ))}
    </div>
  );
}

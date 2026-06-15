import Link from "next/link";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/TaskBadges";
import type { Task } from "@/lib/api";

type EmptyTasksStateProps = {
  projectId: string;
  // Only members who can create tasks (OWNER/ADMIN/MEMBER) see the CTA.
  canCreate: boolean;
  // True when filters are active but match nothing, vs. no tasks at all.
  isFiltered: boolean;
};

export function EmptyTasksState({ projectId, canCreate, isFiltered }: EmptyTasksStateProps) {
  if (isFiltered) {
    return (
      <div className="rounded-md border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
        <h3 className="text-base font-semibold text-neutral-950">No matching tasks</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
          No tasks match the current filters. Try clearing them.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
      <h3 className="text-base font-semibold text-neutral-950">No tasks yet</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
        Tasks track the work inside this project. Create your first one to get started.
      </p>
      {canCreate ? (
        <Link
          href={`/projects/${projectId}/tasks/new`}
          className="mt-6 inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
        >
          Create task
        </Link>
      ) : null}
    </div>
  );
}

export function TaskCard({ task }: { task: Task }) {
  return (
    <li className="rounded-md border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/tasks/${task.id}`}
          className="min-w-0 truncate text-base font-semibold text-neutral-950 hover:underline"
        >
          {task.title}
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
        </div>
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        {task.assignee ? `Assigned to ${task.assignee.name}` : "Unassigned"}
      </p>
    </li>
  );
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </ul>
  );
}

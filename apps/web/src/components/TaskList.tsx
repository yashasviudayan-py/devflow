import { CircleCheckBig } from "lucide-react";
import Link from "next/link";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/TaskBadges";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/states";
import type { Task } from "@/lib/api";

type EmptyTasksStateProps = {
  projectId: string;
  // Only members who can create tasks (OWNER/ADMIN/MEMBER) see the CTA.
  canCreate: boolean;
};

// Shown when a project has no tasks at all. The "no tasks match the filters"
// case is handled separately by EmptyFilteredState.
export function EmptyTasksState({ projectId, canCreate }: EmptyTasksStateProps) {
  return (
    <EmptyState
      icon={CircleCheckBig}
      title="No tasks yet"
      description="Tasks track the work inside this project. Create your first one to get started."
      action={
        canCreate ? (
          <Link href={`/projects/${projectId}/tasks/new`} className={buttonClasses("primary")}>
            Create task
          </Link>
        ) : undefined
      }
    />
  );
}

export function TaskCard({ task }: { task: Task }) {
  return (
    <li className="rounded-card border border-edge-subtle bg-surface p-4 transition-shadow hover:shadow-raised">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/tasks/${task.id}`}
          className="focus-ring min-w-0 truncate rounded text-[15px] font-semibold text-ink hover:text-brand-800"
        >
          {task.title}
        </Link>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-muted">
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

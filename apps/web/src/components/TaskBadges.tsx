import type { TaskPriority, TaskStatus } from "@devflow/shared";

// Human-readable labels and Tailwind colour classes for the API's enum values.
// Keeping these in one place means cards, detail views, and filters stay consistent.
const statusStyles: Record<TaskStatus, { label: string; className: string }> = {
  TODO: { label: "To do", className: "bg-neutral-100 text-neutral-700" },
  IN_PROGRESS: { label: "In progress", className: "bg-blue-100 text-blue-700" },
  IN_REVIEW: { label: "In review", className: "bg-amber-100 text-amber-700" },
  DONE: { label: "Done", className: "bg-emerald-100 text-emerald-700" },
  CANCELED: { label: "Canceled", className: "bg-neutral-200 text-neutral-500" },
};

const priorityStyles: Record<TaskPriority, { label: string; className: string }> = {
  LOW: { label: "Low", className: "bg-neutral-100 text-neutral-600" },
  MEDIUM: { label: "Medium", className: "bg-sky-100 text-sky-700" },
  HIGH: { label: "High", className: "bg-orange-100 text-orange-700" },
  URGENT: { label: "Urgent", className: "bg-red-100 text-red-700" },
};

const badgeBase = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const { label, className } = statusStyles[status];
  return <span className={`${badgeBase} ${className}`}>{label}</span>;
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  const { label, className } = priorityStyles[priority];
  return <span className={`${badgeBase} ${className}`}>{label}</span>;
}

import type { TaskPriority, TaskStatus } from "@devflow/shared";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

// Human-readable labels and badge tones for the API's enum values. Keeping
// these in one place means cards, detail views, and the board stay consistent.
// Every badge pairs its tint with a label and a dot, so state is never
// communicated by color alone.
const statusTones: Record<TaskStatus, { label: string; tone: BadgeTone }> = {
  TODO: { label: "To do", tone: "neutral" },
  IN_PROGRESS: { label: "In progress", tone: "info" },
  IN_REVIEW: { label: "In review", tone: "warning" },
  DONE: { label: "Done", tone: "brand" },
  CANCELED: { label: "Canceled", tone: "faint" },
};

const priorityTones: Record<TaskPriority, { label: string; tone: BadgeTone }> = {
  LOW: { label: "Low", tone: "neutral" },
  MEDIUM: { label: "Medium", tone: "info" },
  HIGH: { label: "High", tone: "warning" },
  URGENT: { label: "Urgent", tone: "danger" },
};

// Dot colors reused by the Kanban column headers so the board's status
// indicators match the badges exactly.
export const statusDotClasses: Record<TaskStatus, string> = {
  TODO: "bg-ink-faint",
  IN_PROGRESS: "bg-sky-500",
  IN_REVIEW: "bg-amber-500",
  DONE: "bg-brand-600",
  CANCELED: "bg-edge-strong",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const { label, tone } = statusTones[status];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  const { label, tone } = priorityTones[priority];
  return <Badge tone={tone}>{label}</Badge>;
}

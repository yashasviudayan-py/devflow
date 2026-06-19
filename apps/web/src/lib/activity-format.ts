import { taskPriorities, taskStatuses, type TaskPriority, type TaskStatus } from "@devflow/shared";
import type { ActivityLog } from "./api";
import { priorityLabel, statusLabel } from "./taskOptions";

// Where the feed is shown. In a task feed the subject is "this task"; in a project
// feed, which lists many tasks, the subject reads better as "a task".
export type ActivityContext = "task" | "project";

type ResolveUserName = (userId: string) => string | undefined;

// Matches the existing convention for a removed/unknown user (see CommentItem).
const UNKNOWN_USER = "Unknown user";

export function activityActorName(log: ActivityLog): string {
  return log.actor?.name ?? UNKNOWN_USER;
}

// Metadata shape varies by action, so values are read defensively: a missing or
// unexpected value yields null and the caller falls back gracefully.
function readString(metadata: ActivityLog["metadata"], key: string): string | null {
  if (!metadata) {
    return null;
  }
  const value = metadata[key];
  return typeof value === "string" ? value : null;
}

function isTaskStatus(value: string | null): value is TaskStatus {
  return value !== null && (taskStatuses as readonly string[]).includes(value);
}

function isTaskPriority(value: string | null): value is TaskPriority {
  return value !== null && (taskPriorities as readonly string[]).includes(value);
}

// Convert a stored enum value to its label, tolerating unknown values so a future
// backend enum never breaks the timeline.
function statusText(value: string | null): string {
  return isTaskStatus(value) ? statusLabel(value) : "Unknown";
}

function priorityText(value: string | null): string {
  return isTaskPriority(value) ? priorityLabel(value) : "Unknown";
}

function taskNoun(context: ActivityContext): string {
  return context === "task" ? "this task" : "a task";
}

/**
 * Turns an activity log into the human-readable predicate that follows the actor
 * name, e.g. "moved this task from To do to In progress". Unknown actions and
 * missing metadata are handled gracefully so the UI never throws or shows blanks.
 */
export function describeActivity(
  log: ActivityLog,
  options: { context: ActivityContext; resolveUserName?: ResolveUserName },
): string {
  const { context, resolveUserName } = options;
  const task = taskNoun(context);

  switch (log.action) {
    case "PROJECT_CREATED":
      return "created the project";
    case "PROJECT_UPDATED":
      return "updated the project details";
    case "PROJECT_ARCHIVED":
      return "archived the project";
    case "TASK_CREATED":
      return `created ${task}`;
    case "TASK_UPDATED":
      return `updated ${task} details`;
    case "TASK_STATUS_CHANGED":
      return `moved ${task} from ${statusText(readString(log.metadata, "from"))} to ${statusText(
        readString(log.metadata, "to"),
      )}`;
    case "TASK_PRIORITY_CHANGED":
      return `changed priority from ${priorityText(
        readString(log.metadata, "from"),
      )} to ${priorityText(readString(log.metadata, "to"))}`;
    case "TASK_ASSIGNED": {
      const assigneeId = readString(log.metadata, "to");
      const name = assigneeId ? resolveUserName?.(assigneeId) : undefined;
      return `assigned ${task} to ${name ?? "a member"}`;
    }
    case "TASK_UNASSIGNED":
      return `unassigned ${task}`;
    case "TASK_ARCHIVED":
      return `archived ${task}`;
    case "COMMENT_CREATED":
      return "added a comment";
    case "COMMENT_UPDATED":
      return "edited a comment";
    case "COMMENT_DELETED":
      return "deleted a comment";
    default:
      // Unknown/future action: keep the feed working with a neutral fallback.
      return "performed an action";
  }
}

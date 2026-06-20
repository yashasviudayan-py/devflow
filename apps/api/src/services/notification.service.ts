import type { NotificationType, PaginationQuery } from "@devflow/shared";
import { Prisma } from "@prisma/client";
import { toCursorArgs, toPage } from "../lib/pagination.js";
import { prisma } from "../lib/prisma.js";
import type { TaskRecord } from "./task.service.js";

// Only safe, public user fields are ever exposed on the nested actor object.
// `passwordHash` is intentionally absent and never selected here.
const notificationActorSelect = {
  id: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;

const notificationSelect = {
  id: true,
  userId: true,
  actorId: true,
  type: true,
  title: true,
  message: true,
  readAt: true,
  data: true,
  createdAt: true,
  updatedAt: true,
  actor: { select: notificationActorSelect },
} satisfies Prisma.NotificationSelect;

export type NotificationRecord = Prisma.NotificationGetPayload<{
  select: typeof notificationSelect;
}>;

type NotificationInput = {
  userId: string;
  actorId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
};

/**
 * Low-level writer for a single notification.
 *
 * Like the activity log, notification creation is intentionally **best-effort**:
 * the API uses single, non-transactional writes, and a notifier is always called
 * *after* the user action it describes has already succeeded. A failed
 * notification write must never turn a successful task/comment mutation into an
 * error for the user, so failures are logged to the server console and swallowed
 * rather than rethrown.
 */
export async function createNotification(input: NotificationInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        actorId: input.actorId ?? null,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data,
      },
    });
  } catch (error) {
    console.error("Failed to create notification", error);
  }
}

// ---------------------------------------------------------------------------
// Notifiers — small helpers wired into the task/comment flows. They take the
// data already in the controller's scope (task, actor, organization) so they
// never re-query, and they encode the self-notification and recipient rules in
// one place.
// ---------------------------------------------------------------------------

// Only id and name are needed: id to compare against recipients (self-skip) and
// name to render readable messages. Express's `req.user` (a SafeUser) satisfies it.
type NotificationActor = {
  id: string;
  name: string;
};

type TaskNotificationContext = {
  organizationId: string;
  actor: NotificationActor;
};

// Context stored in `data` so the eventual UI can deep-link to the right place.
// Recipients are always organization members (assignees are validated on
// assignment, reporters created the task), so no extra org check is needed.
function taskData(ctx: TaskNotificationContext, task: TaskRecord): Prisma.InputJsonValue {
  return {
    taskId: task.id,
    projectId: task.projectId,
    organizationId: ctx.organizationId,
  };
}

/**
 * Notifies a task's assignee that the task was assigned to them. Skips entirely
 * when the task is unassigned or when the assignee is the actor (assigning a task
 * to yourself never produces a self-notification).
 */
export async function notifyTaskAssigned(
  ctx: TaskNotificationContext,
  task: TaskRecord,
): Promise<void> {
  const recipientId = task.assigneeId;

  if (!recipientId || recipientId === ctx.actor.id) {
    return;
  }

  await createNotification({
    userId: recipientId,
    actorId: ctx.actor.id,
    type: "TASK_ASSIGNED",
    title: "Task assigned to you",
    message: `${ctx.actor.name} assigned you "${task.title}"`,
    data: taskData(ctx, task),
  });
}

/**
 * Fans a task update's before/after diff out into notifications, mirroring how
 * `recordTaskChanges` fans it out into activity logs:
 *
 * - Reassignment notifies the *new* assignee (the old assignee is not notified
 *   for now). Self-assignment is skipped by `notifyTaskAssigned`.
 * - Status / priority changes notify the *current* assignee, but only when the
 *   actor is someone other than that assignee — a user changing the status of
 *   their own task is never notified about their own change.
 */
export async function notifyTaskChanges(
  ctx: TaskNotificationContext,
  before: TaskRecord,
  after: TaskRecord,
): Promise<void> {
  if (before.assigneeId !== after.assigneeId && after.assigneeId) {
    await notifyTaskAssigned(ctx, after);
  }

  // Status/priority notifications target the assignee, and only when they did not
  // make the change themselves.
  const assigneeId = after.assigneeId;
  const recipientId = assigneeId && assigneeId !== ctx.actor.id ? assigneeId : null;

  if (!recipientId) {
    return;
  }

  if (before.status !== after.status) {
    await createNotification({
      userId: recipientId,
      actorId: ctx.actor.id,
      type: "TASK_STATUS_CHANGED",
      title: "Task status changed",
      message: `${ctx.actor.name} changed the status of "${after.title}" to ${after.status}`,
      data: { ...(taskData(ctx, after) as object), from: before.status, to: after.status },
    });
  }

  if (before.priority !== after.priority) {
    await createNotification({
      userId: recipientId,
      actorId: ctx.actor.id,
      type: "TASK_PRIORITY_CHANGED",
      title: "Task priority changed",
      message: `${ctx.actor.name} changed the priority of "${after.title}" to ${after.priority}`,
      data: { ...(taskData(ctx, after) as object), from: before.priority, to: after.priority },
    });
  }
}

/**
 * Notifies the people watching a task that a new comment was posted: the task's
 * assignee and the task's reporter (creator). A `Set` deduplicates the case where
 * one user is both, and the comment author is always removed so they are never
 * notified about their own comment.
 */
export async function notifyTaskCommented(
  ctx: TaskNotificationContext,
  task: TaskRecord,
  commentId: string,
): Promise<void> {
  const recipientIds = new Set<string>();

  if (task.assigneeId) {
    recipientIds.add(task.assigneeId);
  }

  if (task.reporterId) {
    recipientIds.add(task.reporterId);
  }

  recipientIds.delete(ctx.actor.id);

  for (const userId of recipientIds) {
    await createNotification({
      userId,
      actorId: ctx.actor.id,
      type: "COMMENT_ADDED",
      title: "New comment",
      message: `${ctx.actor.name} commented on "${task.title}"`,
      data: { ...(taskData(ctx, task) as object), commentId },
    });
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

// Newest first. `id` is a stable tiebreaker so cursor pagination never skips or
// duplicates rows that share a `createdAt`.
const notificationOrderBy: Prisma.NotificationOrderByWithRelationInput[] = [
  { createdAt: "desc" },
  { id: "desc" },
];

export async function getUserNotifications(userId: string, pagination: PaginationQuery = {}) {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: notificationOrderBy,
    ...toCursorArgs(pagination),
    select: notificationSelect,
  });

  return toPage(rows, pagination);
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

// ---------------------------------------------------------------------------
// Ownership-scoped mutations
//
// Every mutation is scoped by `{ id, userId }` so a user can only ever touch
// their own notifications. A wrong id and another user's id are indistinguishable
// to the caller (both yield "not found"), so notification existence never leaks.
// ---------------------------------------------------------------------------

/**
 * Marks a single owned notification read and returns its current state, or `null`
 * when the notification does not exist or belongs to another user. Idempotent:
 * marking an already-read notification simply returns it unchanged.
 */
export async function markNotificationRead(
  notificationId: string,
  userId: string,
): Promise<NotificationRecord | null> {
  // Only flips unread → read; an already-read notification is left untouched.
  await prisma.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });

  return prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: notificationSelect,
  });
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });

  return result.count;
}

/**
 * Hard-deletes an owned notification. Returns `true` when a row was removed and
 * `false` when nothing matched (missing id or another user's notification), which
 * the controller maps to a 404. Notifications have no soft-delete column, mirroring
 * comments.
 */
export async function deleteNotification(
  notificationId: string,
  userId: string,
): Promise<boolean> {
  const result = await prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  });

  return result.count > 0;
}

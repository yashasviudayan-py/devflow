import type {
  ActivityAction,
  ActivityEntityType,
  PaginationQuery,
} from "@devflow/shared";
import { Prisma } from "@prisma/client";
import { toCursorArgs, toPage } from "../lib/pagination.js";
import { prisma } from "../lib/prisma.js";
import type { ProjectRecord } from "./project.service.js";
import type { TaskRecord } from "./task.service.js";

// Only safe, public user fields are ever exposed on the nested actor object.
// `passwordHash` is intentionally absent and never selected here.
const activityActorSelect = {
  id: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;

const activityLogSelect = {
  id: true,
  organizationId: true,
  projectId: true,
  taskId: true,
  actorId: true,
  action: true,
  entityType: true,
  entityId: true,
  metadata: true,
  createdAt: true,
  actor: { select: activityActorSelect },
} satisfies Prisma.ActivityLogSelect;

export type ActivityLogRecord = Prisma.ActivityLogGetPayload<{
  select: typeof activityLogSelect;
}>;

type ActivityLogInput = {
  organizationId: string;
  projectId?: string | null;
  taskId?: string | null;
  actorId?: string | null;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
};

/**
 * Low-level writer for the audit trail.
 *
 * Activity logging is intentionally **best-effort**: the rest of the API uses
 * single, non-transactional writes, and a recorder is always called *after* the
 * user action it describes has already succeeded. A failed audit write must never
 * turn a successful task/project/comment mutation into an error for the user, so
 * failures are logged to the server console and swallowed rather than rethrown.
 */
export async function createActivityLog(data: ActivityLogInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        organizationId: data.organizationId,
        projectId: data.projectId ?? null,
        taskId: data.taskId ?? null,
        actorId: data.actorId ?? null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: data.metadata,
      },
    });
  } catch (error) {
    console.error("Failed to write activity log", error);
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

// Newest activity first. `id` is a stable tiebreaker so cursor pagination never
// skips or duplicates rows that share a `createdAt`.
const activityOrderBy: Prisma.ActivityLogOrderByWithRelationInput[] = [
  { createdAt: "desc" },
  { id: "desc" },
];

export async function listTaskActivity(taskId: string, pagination: PaginationQuery = {}) {
  // Both task events and comment events on the task are stamped with `taskId`,
  // so a single indexed lookup returns the full timeline for a task.
  const rows = await prisma.activityLog.findMany({
    where: { taskId },
    orderBy: activityOrderBy,
    ...toCursorArgs(pagination),
    select: activityLogSelect,
  });

  return toPage(rows, pagination);
}

export async function listProjectActivity(projectId: string, pagination: PaginationQuery = {}) {
  // Every project/task/comment event under a project is stamped with `projectId`,
  // so this returns the whole project timeline (including its tasks and comments)
  // with one indexed lookup.
  const rows = await prisma.activityLog.findMany({
    where: { projectId },
    orderBy: activityOrderBy,
    ...toCursorArgs(pagination),
    select: activityLogSelect,
  });

  return toPage(rows, pagination);
}

// ---------------------------------------------------------------------------
// Recorders — small helpers that build well-shaped metadata and delegate to
// `createActivityLog`. Project/task recorders take explicit context because the
// controllers already hold it; comment recorders resolve project/org context
// from the task, since the comment controllers do not have it in scope.
// ---------------------------------------------------------------------------

type ProjectContext = {
  organizationId: string;
  actorId: string | null;
};

type TaskContext = {
  organizationId: string;
  actorId: string | null;
};

export async function recordProjectCreated(ctx: ProjectContext, project: ProjectRecord) {
  await createActivityLog({
    organizationId: ctx.organizationId,
    projectId: project.id,
    actorId: ctx.actorId,
    action: "PROJECT_CREATED",
    entityType: "PROJECT",
    entityId: project.id,
    metadata: { name: project.name },
  });
}

export async function recordProjectUpdated(
  ctx: ProjectContext,
  before: ProjectRecord,
  after: ProjectRecord,
) {
  const changes = diffProject(before, after);

  // Nothing meaningful changed (e.g. a no-op PATCH) — skip the log.
  if (Object.keys(changes).length === 0) {
    return;
  }

  await createActivityLog({
    organizationId: ctx.organizationId,
    projectId: after.id,
    actorId: ctx.actorId,
    action: "PROJECT_UPDATED",
    entityType: "PROJECT",
    entityId: after.id,
    metadata: { changes },
  });
}

export async function recordProjectArchived(ctx: ProjectContext, project: ProjectRecord) {
  await createActivityLog({
    organizationId: ctx.organizationId,
    projectId: project.id,
    actorId: ctx.actorId,
    action: "PROJECT_ARCHIVED",
    entityType: "PROJECT",
    entityId: project.id,
    metadata: { name: project.name },
  });
}

export async function recordTaskCreated(ctx: TaskContext, task: TaskRecord) {
  await createActivityLog({
    organizationId: ctx.organizationId,
    projectId: task.projectId,
    taskId: task.id,
    actorId: ctx.actorId,
    action: "TASK_CREATED",
    entityType: "TASK",
    entityId: task.id,
    metadata: {
      title: task.title,
      status: task.status,
      priority: task.priority,
    },
  });
}

/**
 * A single `PATCH /tasks/:id` can change several things at once, so this fans the
 * before/after diff out into the granular events the spec asks for
 * (status/priority/assignment changes), plus a catch-all `TASK_UPDATED` for
 * content edits (title/description/dueDate). Each emitted event carries the
 * relevant old/new values in its metadata.
 */
export async function recordTaskChanges(ctx: TaskContext, before: TaskRecord, after: TaskRecord) {
  const base = {
    organizationId: ctx.organizationId,
    projectId: after.projectId,
    taskId: after.id,
    actorId: ctx.actorId,
    entityType: "TASK" as const,
    entityId: after.id,
  };

  if (before.status !== after.status) {
    await createActivityLog({
      ...base,
      action: "TASK_STATUS_CHANGED",
      metadata: { from: before.status, to: after.status },
    });
  }

  if (before.priority !== after.priority) {
    await createActivityLog({
      ...base,
      action: "TASK_PRIORITY_CHANGED",
      metadata: { from: before.priority, to: after.priority },
    });
  }

  if (before.assigneeId !== after.assigneeId) {
    if (after.assigneeId === null) {
      await createActivityLog({
        ...base,
        action: "TASK_UNASSIGNED",
        metadata: { from: before.assigneeId },
      });
    } else {
      await createActivityLog({
        ...base,
        action: "TASK_ASSIGNED",
        metadata: { from: before.assigneeId, to: after.assigneeId },
      });
    }
  }

  // Archiving via PATCH (`archived: true`) is recorded the same way as the DELETE
  // endpoint. Restoring (`archived: false`) is treated as a content update below.
  const archivedNow = before.archivedAt === null && after.archivedAt !== null;
  if (archivedNow) {
    await createActivityLog({
      ...base,
      action: "TASK_ARCHIVED",
      metadata: { title: after.title },
    });
  }

  const contentChanges = diffTaskContent(before, after);
  if (Object.keys(contentChanges).length > 0) {
    await createActivityLog({
      ...base,
      action: "TASK_UPDATED",
      metadata: { changes: contentChanges },
    });
  }
}

export async function recordTaskArchived(ctx: TaskContext, task: TaskRecord) {
  await createActivityLog({
    organizationId: ctx.organizationId,
    projectId: task.projectId,
    taskId: task.id,
    actorId: ctx.actorId,
    action: "TASK_ARCHIVED",
    entityType: "TASK",
    entityId: task.id,
    metadata: { title: task.title },
  });
}

type CommentContext = {
  taskId: string;
  commentId: string;
  actorId: string | null;
};

export async function recordCommentCreated(ctx: CommentContext) {
  await recordCommentEvent(ctx, "COMMENT_CREATED");
}

export async function recordCommentUpdated(ctx: CommentContext) {
  await recordCommentEvent(ctx, "COMMENT_UPDATED");
}

export async function recordCommentDeleted(ctx: CommentContext) {
  await recordCommentEvent(ctx, "COMMENT_DELETED");
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function recordCommentEvent(ctx: CommentContext, action: ActivityAction) {
  // Comment controllers do not hold the project/org in scope, so we re-derive
  // them from the task (comment -> task -> project -> organization), mirroring
  // how the comment authorization middleware resolves access.
  const context = await resolveTaskContext(ctx.taskId);
  if (!context) {
    return;
  }

  await createActivityLog({
    organizationId: context.organizationId,
    projectId: context.projectId,
    taskId: ctx.taskId,
    actorId: ctx.actorId,
    action,
    entityType: "COMMENT",
    entityId: ctx.commentId,
  });
}

async function resolveTaskContext(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      projectId: true,
      project: { select: { organizationId: true } },
    },
  });

  if (!task) {
    return null;
  }

  return { projectId: task.projectId, organizationId: task.project.organizationId };
}

// Captures the project fields a member can actually edit. `description` old/new
// is recorded since it is short enough to be useful. Returns a JSON-safe object.
function diffProject(before: ProjectRecord, after: ProjectRecord): Record<string, Prisma.InputJsonValue> {
  const changes: Record<string, Prisma.InputJsonValue> = {};

  if (before.name !== after.name) {
    changes.name = { from: before.name, to: after.name };
  }

  if (before.description !== after.description) {
    changes.description = { from: before.description ?? null, to: after.description ?? null };
  }

  const wasArchived = before.archivedAt !== null;
  const isArchived = after.archivedAt !== null;
  if (wasArchived !== isArchived) {
    changes.archived = { from: wasArchived, to: isArchived };
  }

  return changes;
}

// Content edits not already captured by a dedicated status/priority/assignment
// event. Task descriptions can be long (up to 5000 chars), so we record only
// that it changed rather than dumping both full bodies into the audit metadata.
function diffTaskContent(before: TaskRecord, after: TaskRecord): Record<string, Prisma.InputJsonValue> {
  const changes: Record<string, Prisma.InputJsonValue> = {};

  if (before.title !== after.title) {
    changes.title = { from: before.title, to: after.title };
  }

  if (before.description !== after.description) {
    changes.description = { changed: true };
  }

  if (toTime(before.dueDate) !== toTime(after.dueDate)) {
    // Dates are not valid JSON, so due dates are serialized to ISO strings.
    changes.dueDate = { from: toIso(before.dueDate), to: toIso(after.dueDate) };
  }

  return changes;
}

function toTime(value: Date | null) {
  return value === null ? null : value.getTime();
}

function toIso(value: Date | null) {
  return value === null ? null : value.toISOString();
}

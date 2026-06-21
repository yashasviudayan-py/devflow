import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "@devflow/shared";
import { Prisma } from "@prisma/client";
import { toCursorArgs, toPage } from "../lib/pagination.js";
import { prisma } from "../lib/prisma.js";
import { normalizeSearchQuery, parseSortParams } from "../lib/query.js";

// Only safe, public user fields are ever exposed on nested assignee/reporter
// objects. `passwordHash` is intentionally absent and never selected here.
const taskUserSelect = {
  id: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;

const taskSelect = {
  id: true,
  projectId: true,
  assigneeId: true,
  reporterId: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  assignee: { select: taskUserSelect },
  reporter: { select: taskUserSelect },
} satisfies Prisma.TaskSelect;

export type TaskRecord = Prisma.TaskGetPayload<{
  select: typeof taskSelect;
}>;

// Used by the task middleware to resolve the organization that owns a task
// (task -> project -> organization) for the authorization check.
export type TaskWithOrganization = TaskRecord & {
  project: { organizationId: string };
};

export async function createTask(projectId: string, reporterId: string, input: CreateTaskInput) {
  return prisma.task.create({
    data: {
      projectId,
      reporterId,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
    },
    select: taskSelect,
  });
}

export async function listTasks(projectId: string, query: ListTasksQuery = {}) {
  const search = normalizeSearchQuery(query.q);
  const { field, order } = parseSortParams(query, { field: "createdAt" });

  const where: Prisma.TaskWhereInput = {
    projectId,
    // Archived tasks are soft-deleted, so they are excluded from the default listing.
    archivedAt: null,
    // Each filter is an additional AND constraint on the project-scoped result set.
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    // `unassigned` takes precedence over `assigneeId`: it matches tasks with no
    // assignee, so a stray assigneeId passed alongside it is ignored.
    ...(query.unassigned
      ? { assigneeId: null }
      : query.assigneeId
        ? { assigneeId: query.assigneeId }
        : {}),
    ...(query.dueAfter || query.dueBefore
      ? {
          dueDate: {
            ...(query.dueAfter ? { gte: query.dueAfter } : {}),
            ...(query.dueBefore ? { lte: query.dueBefore } : {}),
          },
        }
      : {}),
    // Case-insensitive substring match across title and (when present) description.
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const rows = await prisma.task.findMany({
    where,
    // `field` comes from a validated allow-list (listTasksQuerySchema); `id` is a
    // stable tiebreaker so cursor pagination never skips/duplicates rows.
    orderBy: [{ [field]: order } as Prisma.TaskOrderByWithRelationInput, { id: order }],
    ...toCursorArgs(query),
    select: taskSelect,
  });

  return toPage(rows, query);
}

export async function getTaskWithOrganization(
  taskId: string,
): Promise<TaskWithOrganization | null> {
  return prisma.task.findUnique({
    where: {
      id: taskId,
    },
    select: {
      ...taskSelect,
      project: {
        select: {
          organizationId: true,
        },
      },
    },
  });
}

export async function updateTask(taskId: string, input: UpdateTaskInput) {
  const data: Prisma.TaskUncheckedUpdateInput = {};

  if (input.title !== undefined) {
    data.title = input.title;
  }

  if (input.description !== undefined) {
    data.description = input.description;
  }

  if (input.status !== undefined) {
    data.status = input.status;
  }

  if (input.priority !== undefined) {
    data.priority = input.priority;
  }

  if (input.dueDate !== undefined) {
    data.dueDate = input.dueDate;
  }

  if (input.assigneeId !== undefined) {
    // `null` unassigns the task; a string reassigns it.
    data.assigneeId = input.assigneeId;
  }

  if (input.archived !== undefined) {
    data.archivedAt = input.archived ? new Date() : null;
  }

  return prisma.task.update({
    where: {
      id: taskId,
    },
    data,
    select: taskSelect,
  });
}

export async function archiveTask(taskId: string) {
  return prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      archivedAt: new Date(),
    },
    select: taskSelect,
  });
}

// Validates that an assignee is a member of the organization that owns the task's
// project, so tasks can never be assigned to users outside the organization.
export async function assigneeBelongsToOrganization(
  organizationId: string,
  userId: string,
): Promise<boolean> {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  return membership !== null;
}

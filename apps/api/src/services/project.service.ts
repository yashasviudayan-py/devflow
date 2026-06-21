import type { CreateProjectInput, ListProjectsQuery, UpdateProjectInput } from "@devflow/shared";
import { Prisma } from "@prisma/client";
import { toCursorArgs, toPage } from "../lib/pagination.js";
import { prisma } from "../lib/prisma.js";
import { normalizeSearchQuery, parseSortParams } from "../lib/query.js";

const projectSelect = {
  id: true,
  organizationId: true,
  createdById: true,
  name: true,
  description: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

export type ProjectRecord = Prisma.ProjectGetPayload<{
  select: typeof projectSelect;
}>;

export async function createProject(
  organizationId: string,
  createdById: string,
  input: CreateProjectInput,
) {
  return prisma.project.create({
    data: {
      organizationId,
      createdById,
      name: input.name,
      description: input.description,
    },
    select: projectSelect,
  });
}

export async function listProjects(organizationId: string, query: ListProjectsQuery = {}) {
  const search = normalizeSearchQuery(query.q);
  const { field, order } = parseSortParams(query, { field: "createdAt" });

  const where: Prisma.ProjectWhereInput = {
    organizationId,
    // Archived projects are soft-deleted, so they are excluded from the default listing.
    archivedAt: null,
    // Case-insensitive substring match across name and (when present) description.
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const rows = await prisma.project.findMany({
    where,
    // `field` comes from a validated allow-list (listProjectsQuerySchema); `id` is a
    // stable tiebreaker so cursor pagination never skips/duplicates rows.
    orderBy: [{ [field]: order } as Prisma.ProjectOrderByWithRelationInput, { id: order }],
    ...toCursorArgs(query),
    select: projectSelect,
  });

  return toPage(rows, query);
}

export async function getProjectById(projectId: string): Promise<ProjectRecord | null> {
  return prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: projectSelect,
  });
}

export async function updateProject(projectId: string, input: UpdateProjectInput) {
  const data: Prisma.ProjectUpdateInput = {};

  if (input.name !== undefined) {
    data.name = input.name;
  }

  if (input.description !== undefined) {
    data.description = input.description;
  }

  if (input.archived !== undefined) {
    data.archivedAt = input.archived ? new Date() : null;
  }

  return prisma.project.update({
    where: {
      id: projectId,
    },
    data,
    select: projectSelect,
  });
}

export async function archiveProject(projectId: string) {
  return prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      archivedAt: new Date(),
    },
    select: projectSelect,
  });
}

import type { CreateProjectInput, PaginationQuery, UpdateProjectInput } from "@devflow/shared";
import { Prisma } from "@prisma/client";
import { toCursorArgs, toPage } from "../lib/pagination.js";
import { prisma } from "../lib/prisma.js";

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

export async function listProjects(organizationId: string, pagination: PaginationQuery = {}) {
  // Archived projects are soft-deleted, so they are excluded from the default listing.
  const rows = await prisma.project.findMany({
    where: {
      organizationId,
      archivedAt: null,
    },
    // `id` is a stable tiebreaker so cursor pagination never skips/duplicates rows.
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    ...toCursorArgs(pagination),
    select: projectSelect,
  });

  return toPage(rows, pagination);
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

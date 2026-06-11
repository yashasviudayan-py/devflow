import { randomBytes } from "node:crypto";
import type { CreateOrganizationInput, UpdateOrganizationInput } from "@devflow/shared";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.middleware.js";

const organizationSelect = {
  id: true,
  name: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OrganizationSelect;

const memberSelect = {
  id: true,
  role: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.OrganizationMemberSelect;

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
}

async function generateUniqueSlug(name: string) {
  const base = slugify(name) || "org";

  const existing = await prisma.organization.findUnique({
    where: {
      slug: base,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return base;
  }

  return `${base}-${randomBytes(3).toString("hex")}`;
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createOrganization(userId: string, input: CreateOrganizationInput) {
  const slug = input.slug ?? (await generateUniqueSlug(input.name));

  try {
    const organization = await prisma.organization.create({
      data: {
        name: input.name,
        slug,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
      select: organizationSelect,
    });

    return {
      ...organization,
      role: "OWNER" as const,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new HttpError("Slug is already in use.", 409);
    }

    throw error;
  }
}

export async function listOrganizationsForUser(userId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      role: true,
      organization: {
        select: organizationSelect,
      },
    },
  });

  return memberships.map((membership) => ({
    ...membership.organization,
    role: membership.role,
  }));
}

export async function getOrganizationById(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: organizationSelect,
  });

  if (!organization) {
    throw new HttpError("Organization not found", 404);
  }

  return organization;
}

export async function updateOrganization(organizationId: string, input: UpdateOrganizationInput) {
  const data: Prisma.OrganizationUpdateInput = {};

  if (input.name !== undefined) {
    data.name = input.name;
  }

  if (input.slug !== undefined) {
    data.slug = input.slug;
  }

  try {
    return await prisma.organization.update({
      where: {
        id: organizationId,
      },
      data,
      select: organizationSelect,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new HttpError("Slug is already in use.", 409);
    }

    throw error;
  }
}

export async function listOrganizationMembers(organizationId: string) {
  const members = await prisma.organizationMember.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: memberSelect,
  });

  return members.map((member) => ({
    id: member.id,
    role: member.role,
    joinedAt: member.createdAt,
    user: member.user,
  }));
}

export async function removeOrganizationMember(organizationId: string, memberId: string) {
  const member = await prisma.organizationMember.findUnique({
    where: {
      id: memberId,
    },
    select: {
      id: true,
      role: true,
      organizationId: true,
    },
  });

  if (!member || member.organizationId !== organizationId) {
    throw new HttpError("Member not found", 404);
  }

  if (member.role === "OWNER") {
    const ownerCount = await prisma.organizationMember.count({
      where: {
        organizationId,
        role: "OWNER",
      },
    });

    if (ownerCount <= 1) {
      throw new HttpError("Cannot remove the only owner of an organization.", 400);
    }
  }

  await prisma.organizationMember.delete({
    where: {
      id: member.id,
    },
  });
}

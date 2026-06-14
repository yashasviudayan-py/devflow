import type { UserRole } from "@devflow/shared";
import type { Express } from "express";
import request from "supertest";
import { expect } from "vitest";
import { prisma } from "../lib/prisma.js";

export { prisma };

// Tables in FK-safe order is unnecessary with CASCADE, but listing every table
// keeps the reset explicit. `RESTART IDENTITY CASCADE` clears dependent rows too.
const TABLES = [
  "Notification",
  "ActivityLog",
  "Comment",
  "Task",
  "Project",
  "OrganizationMember",
  "Organization",
  "User",
];

/**
 * Truncates every table between tests. The Prisma client connects with the
 * `test` schema on its search_path, so the unqualified identifiers resolve there
 * and dev data in `public` is never touched.
 */
export async function resetDatabase() {
  const list = TABLES.map((table) => `"${table}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`);
}

let cachedApp: Express | undefined;

// Imported lazily so the test env (DATABASE_URL etc.) is fully applied before
// the app — and the Prisma client it pulls in — is constructed.
export async function getApp(): Promise<Express> {
  if (!cachedApp) {
    ({ app: cachedApp } = await import("../app.js"));
  }

  return cachedApp;
}

export type TestUser = {
  id: string;
  cookies: string[];
};

export async function signupUser(name: string, email: string): Promise<TestUser> {
  const app = await getApp();
  const response = await request(app).post("/auth/signup").send({
    name,
    email,
    password: "password123",
  });

  expect(response.status).toBe(201);

  return {
    id: response.body.user.id as string,
    cookies: response.headers["set-cookie"] as unknown as string[],
  };
}

export async function createOrganization(
  cookies: string[],
  body: Record<string, unknown> = { name: "Acme Inc" },
) {
  const app = await getApp();
  const response = await request(app).post("/organizations").set("Cookie", cookies).send(body);

  expect(response.status).toBe(201);

  return response.body.organization as {
    id: string;
    name: string;
    slug: string;
    role: UserRole;
  };
}

export async function createProject(
  cookies: string[],
  organizationId: string,
  body: Record<string, unknown> = { name: "Website redesign" },
) {
  const app = await getApp();
  const response = await request(app)
    .post(`/organizations/${organizationId}/projects`)
    .set("Cookie", cookies)
    .send(body);

  expect(response.status).toBe(201);

  return response.body.project as {
    id: string;
    organizationId: string;
    name: string;
    archivedAt: string | null;
  };
}

// Adds an existing user to an organization with a given role. There is no public
// "add member" endpoint yet, so tests seed memberships directly.
export async function addMember(organizationId: string, userId: string, role: UserRole) {
  return prisma.organizationMember.create({
    data: {
      organizationId,
      userId,
      role,
    },
    select: {
      id: true,
      organizationId: true,
      userId: true,
      role: true,
    },
  });
}

export async function findMembership(organizationId: string, userId: string) {
  return prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    select: {
      id: true,
      organizationId: true,
      userId: true,
      role: true,
    },
  });
}

export async function countMembers(organizationId?: string) {
  return prisma.organizationMember.count({
    where: organizationId ? { organizationId } : undefined,
  });
}

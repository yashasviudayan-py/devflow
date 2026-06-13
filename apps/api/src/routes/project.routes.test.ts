import type { Express } from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

process.env.JWT_SECRET = "test-jwt-secret";
process.env.NODE_ENV = "test";
process.env.WEB_URL = "http://localhost:3000";

const mockDb = vi.hoisted(() => {
  type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

  type StoredUser = {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
  };

  type StoredOrganization = {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
  };

  type StoredMember = {
    id: string;
    organizationId: string;
    userId: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
  };

  type StoredProject = {
    id: string;
    organizationId: string;
    createdById: string | null;
    name: string;
    description: string | null;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };

  type Select = Record<string, boolean | { select?: Select }>;

  const users: StoredUser[] = [];
  const organizations: StoredOrganization[] = [];
  const members: StoredMember[] = [];
  const projects: StoredProject[] = [];
  let nextId = 1;

  const now = () => new Date("2026-06-08T00:00:00.000Z");

  function applySelect(
    record: Record<string, unknown>,
    select: Select | undefined,
  ): Record<string, unknown> {
    if (!select) {
      return { ...record };
    }

    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(select)) {
      if (value) {
        result[key] = record[key];
      }
    }

    return result;
  }

  const user = {
    findUnique: async (args: { where: { id?: string; email?: string }; select?: Select }) => {
      const match = users.find((candidate) => {
        return candidate.id === args.where.id || candidate.email === args.where.email;
      });

      return match ? applySelect(match, args.select) : null;
    },
    create: async (args: {
      data: { name: string; email: string; passwordHash: string };
      select?: Select;
    }) => {
      const record: StoredUser = {
        id: `user_${nextId++}`,
        name: args.data.name,
        email: args.data.email,
        passwordHash: args.data.passwordHash,
        createdAt: now(),
        updatedAt: now(),
      };

      users.push(record);

      return applySelect(record, args.select);
    },
  };

  const organization = {
    findUnique: async (args: { where: { id?: string; slug?: string }; select?: Select }) => {
      const match = organizations.find((candidate) => {
        return candidate.id === args.where.id || candidate.slug === args.where.slug;
      });

      return match ? applySelect(match, args.select) : null;
    },
    create: async (args: {
      data: {
        name: string;
        slug: string;
        members?: { create: { userId: string; role: Role } };
      };
      select?: Select;
    }) => {
      const record: StoredOrganization = {
        id: `org_${nextId++}`,
        name: args.data.name,
        slug: args.data.slug,
        createdAt: now(),
        updatedAt: now(),
      };

      organizations.push(record);

      if (args.data.members?.create) {
        members.push({
          id: `member_${nextId++}`,
          organizationId: record.id,
          userId: args.data.members.create.userId,
          role: args.data.members.create.role,
          createdAt: now(),
          updatedAt: now(),
        });
      }

      return applySelect(record, args.select);
    },
  };

  const organizationMember = {
    findUnique: async (args: {
      where: {
        id?: string;
        organizationId_userId?: { organizationId: string; userId: string };
      };
      select?: Select;
    }) => {
      const match = members.find((candidate) => {
        if (args.where.id) {
          return candidate.id === args.where.id;
        }

        if (args.where.organizationId_userId) {
          return (
            candidate.organizationId === args.where.organizationId_userId.organizationId &&
            candidate.userId === args.where.organizationId_userId.userId
          );
        }

        return false;
      });

      return match ? applySelect(match, args.select) : null;
    },
  };

  const project = {
    create: async (args: {
      data: {
        organizationId: string;
        createdById: string;
        name: string;
        description?: string;
      };
      select?: Select;
    }) => {
      const record: StoredProject = {
        id: `project_${nextId++}`,
        organizationId: args.data.organizationId,
        createdById: args.data.createdById,
        name: args.data.name,
        description: args.data.description ?? null,
        archivedAt: null,
        createdAt: now(),
        updatedAt: now(),
      };

      projects.push(record);

      return applySelect(record, args.select);
    },
    findUnique: async (args: { where: { id: string }; select?: Select }) => {
      const match = projects.find((candidate) => candidate.id === args.where.id);

      return match ? applySelect(match, args.select) : null;
    },
    findMany: async (args: {
      where: { organizationId?: string; archivedAt?: Date | null };
      select?: Select;
    }) => {
      const matches = projects.filter((candidate) => {
        if (
          args.where.organizationId !== undefined &&
          candidate.organizationId !== args.where.organizationId
        ) {
          return false;
        }

        if (args.where.archivedAt === null && candidate.archivedAt !== null) {
          return false;
        }

        return true;
      });

      return matches.map((candidate) => applySelect(candidate, args.select));
    },
    update: async (args: {
      where: { id: string };
      data: { name?: string; description?: string; archivedAt?: Date | null };
      select?: Select;
    }) => {
      const record = projects.find((candidate) => candidate.id === args.where.id);

      if (!record) {
        throw new Error(`Mock project not found: ${args.where.id}`);
      }

      if (args.data.name !== undefined) {
        record.name = args.data.name;
      }

      if (args.data.description !== undefined) {
        record.description = args.data.description;
      }

      if (args.data.archivedAt !== undefined) {
        record.archivedAt = args.data.archivedAt;
      }

      return applySelect(record, args.select);
    },
  };

  return {
    reset() {
      users.splice(0, users.length);
      organizations.splice(0, organizations.length);
      members.splice(0, members.length);
      projects.splice(0, projects.length);
      nextId = 1;
    },
    addMember(organizationId: string, userId: string, role: Role) {
      const record: StoredMember = {
        id: `member_${nextId++}`,
        organizationId,
        userId,
        role,
        createdAt: now(),
        updatedAt: now(),
      };

      members.push(record);

      return record;
    },
    user,
    organization,
    organizationMember,
    project,
    projects,
  };
});

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    user: mockDb.user,
    organization: mockDb.organization,
    organizationMember: mockDb.organizationMember,
    project: mockDb.project,
  },
}));

let app: Express;

beforeAll(async () => {
  ({ app } = await import("../app.js"));
});

beforeEach(() => {
  mockDb.reset();
});

async function signupUser(name: string, email: string) {
  const response = await request(app).post("/auth/signup").send({
    name,
    email,
    password: "password123",
  });

  expect(response.status).toBe(201);

  const cookies = response.headers["set-cookie"] as unknown as string[];

  return {
    id: response.body.user.id as string,
    cookies,
  };
}

async function createOrganization(cookies: string[], name = "Acme Inc") {
  const response = await request(app).post("/organizations").set("Cookie", cookies).send({ name });

  expect(response.status).toBe(201);

  return response.body.organization as { id: string };
}

async function createProject(
  cookies: string[],
  organizationId: string,
  body: Record<string, unknown> = { name: "Website redesign" },
) {
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

describe("project routes", () => {
  describe("POST /organizations/:organizationId/projects", () => {
    it("lets an organization member create a project", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .post(`/organizations/${organization.id}/projects`)
        .set("Cookie", owner.cookies)
        .send({ name: "Website redesign", description: "Refresh the marketing site." });

      expect(response.status).toBe(201);
      expect(response.body.project).toMatchObject({
        name: "Website redesign",
        description: "Refresh the marketing site.",
        organizationId: organization.id,
        createdById: owner.id,
        archivedAt: null,
      });
    });

    it("lets a MEMBER create a project", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);

      mockDb.addMember(organization.id, member.id, "MEMBER");

      const response = await request(app)
        .post(`/organizations/${organization.id}/projects`)
        .set("Cookie", member.cookies)
        .send({ name: "Member project" });

      expect(response.status).toBe(201);
      expect(response.body.project.createdById).toBe(member.id);
    });

    it("rejects a VIEWER with 403", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const viewer = await signupUser("Viewer Example", "viewer@example.com");
      const organization = await createOrganization(owner.cookies);

      mockDb.addMember(organization.id, viewer.id, "VIEWER");

      const response = await request(app)
        .post(`/organizations/${organization.id}/projects`)
        .set("Cookie", viewer.cookies)
        .send({ name: "Viewer project" });

      expect(response.status).toBe(403);
    });

    it("rejects an unauthenticated request", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .post(`/organizations/${organization.id}/projects`)
        .send({ name: "Website redesign" });

      expect(response.status).toBe(401);
    });

    it("rejects a non-member with 404", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .post(`/organizations/${organization.id}/projects`)
        .set("Cookie", outsider.cookies)
        .send({ name: "Website redesign" });

      expect(response.status).toBe(404);
    });

    it("rejects invalid input", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .post(`/organizations/${organization.id}/projects`)
        .set("Cookie", owner.cookies)
        .send({ name: "A" });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("Invalid request body");
    });
  });

  describe("GET /organizations/:organizationId/projects", () => {
    it("lets a member list projects and excludes archived ones", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);

      const kept = await createProject(owner.cookies, organization.id, { name: "Active project" });
      const archived = await createProject(owner.cookies, organization.id, {
        name: "Archived project",
      });

      await request(app)
        .delete(`/projects/${archived.id}`)
        .set("Cookie", owner.cookies)
        .expect(200);

      const response = await request(app)
        .get(`/organizations/${organization.id}/projects`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(response.body.projects).toHaveLength(1);
      expect(response.body.projects[0].id).toBe(kept.id);
    });

    it("rejects a non-member with 404", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .get(`/organizations/${organization.id}/projects`)
        .set("Cookie", outsider.cookies);

      expect(response.status).toBe(404);
    });

    it("only returns projects from the requested organization", async () => {
      const alice = await signupUser("Alice Example", "alice@example.com");
      const bob = await signupUser("Bob Example", "bob@example.com");

      const aliceOrg = await createOrganization(alice.cookies, "Alice Org");
      const bobOrg = await createOrganization(bob.cookies, "Bob Org");

      const aliceProject = await createProject(alice.cookies, aliceOrg.id, {
        name: "Alice project",
      });
      await createProject(bob.cookies, bobOrg.id, { name: "Bob project" });

      const response = await request(app)
        .get(`/organizations/${aliceOrg.id}/projects`)
        .set("Cookie", alice.cookies);

      expect(response.status).toBe(200);
      expect(response.body.projects).toHaveLength(1);
      expect(response.body.projects[0].id).toBe(aliceProject.id);
    });
  });

  describe("GET /projects/:projectId", () => {
    it("lets a member view a project", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .get(`/projects/${project.id}`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(response.body.project.id).toBe(project.id);
    });

    it("returns 404 for a non-member without leaking existence", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .get(`/projects/${project.id}`)
        .set("Cookie", outsider.cookies);

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe("Project not found");
    });

    it("rejects an unauthenticated request", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app).get(`/projects/${project.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /projects/:projectId", () => {
    it("lets an OWNER update a project", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .patch(`/projects/${project.id}`)
        .set("Cookie", owner.cookies)
        .send({ name: "Renamed project" });

      expect(response.status).toBe(200);
      expect(response.body.project.name).toBe("Renamed project");
    });

    it("lets an ADMIN update a project", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const admin = await signupUser("Admin Example", "admin@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      mockDb.addMember(organization.id, admin.id, "ADMIN");

      const response = await request(app)
        .patch(`/projects/${project.id}`)
        .set("Cookie", admin.cookies)
        .send({ description: "Updated by admin" });

      expect(response.status).toBe(200);
      expect(response.body.project.description).toBe("Updated by admin");
    });

    it("rejects a MEMBER with 403", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      mockDb.addMember(organization.id, member.id, "MEMBER");

      const response = await request(app)
        .patch(`/projects/${project.id}`)
        .set("Cookie", member.cookies)
        .send({ name: "Member rename" });

      expect(response.status).toBe(403);
    });

    it("rejects a non-member with 404", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .patch(`/projects/${project.id}`)
        .set("Cookie", outsider.cookies)
        .send({ name: "Hijacked" });

      expect(response.status).toBe(404);
    });

    it("rejects an empty update", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .patch(`/projects/${project.id}`)
        .set("Cookie", owner.cookies)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /projects/:projectId", () => {
    it("lets an OWNER archive a project", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .delete(`/projects/${project.id}`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      const stored = mockDb.projects.find((candidate) => candidate.id === project.id);
      expect(stored?.archivedAt).not.toBeNull();
    });

    it("lets an ADMIN archive a project", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const admin = await signupUser("Admin Example", "admin@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      mockDb.addMember(organization.id, admin.id, "ADMIN");

      const response = await request(app)
        .delete(`/projects/${project.id}`)
        .set("Cookie", admin.cookies);

      expect(response.status).toBe(200);
    });

    it("rejects a MEMBER with 403", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      mockDb.addMember(organization.id, member.id, "MEMBER");

      const response = await request(app)
        .delete(`/projects/${project.id}`)
        .set("Cookie", member.cookies);

      expect(response.status).toBe(403);
    });

    it("rejects a non-member with 404", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .delete(`/projects/${project.id}`)
        .set("Cookie", outsider.cookies);

      expect(response.status).toBe(404);
    });
  });
});

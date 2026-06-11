import type { Express } from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

process.env.JWT_SECRET = "test-jwt-secret";
process.env.NODE_ENV = "test";
process.env.WEB_URL = "http://localhost:3000";

const mockDb = vi.hoisted(() => {
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
    role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
    createdAt: Date;
    updatedAt: Date;
  };

  type Select = Record<string, boolean | { select?: Select }>;

  const users: StoredUser[] = [];
  const organizations: StoredOrganization[] = [];
  const members: StoredMember[] = [];
  let nextId = 1;

  const now = () => new Date("2026-06-08T00:00:00.000Z");

  async function uniqueConstraintError() {
    const { Prisma } = await import("@prisma/client");

    return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "test",
    });
  }

  function applySelect(
    record: Record<string, unknown>,
    select: Select | undefined,
    resolveRelation?: Record<string, (nestedSelect?: Select) => unknown>,
  ): Record<string, unknown> {
    if (!select) {
      return { ...record };
    }

    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(select)) {
      if (!value) {
        continue;
      }

      if (typeof value === "object" && resolveRelation?.[key]) {
        result[key] = resolveRelation[key](value.select);
      } else if (resolveRelation?.[key]) {
        result[key] = resolveRelation[key](undefined);
      } else {
        result[key] = record[key];
      }
    }

    return result;
  }

  function selectUser(userId: string, select?: Select) {
    const user = users.find((candidate) => candidate.id === userId);

    if (!user) {
      throw new Error(`Mock user not found: ${userId}`);
    }

    return applySelect(user, select);
  }

  function selectOrganization(organizationId: string, select?: Select) {
    const organization = organizations.find((candidate) => candidate.id === organizationId);

    if (!organization) {
      throw new Error(`Mock organization not found: ${organizationId}`);
    }

    return applySelect(organization, select);
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
        members?: { create: { userId: string; role: StoredMember["role"] } };
      };
      select?: Select;
    }) => {
      if (organizations.some((candidate) => candidate.slug === args.data.slug)) {
        throw await uniqueConstraintError();
      }

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
    update: async (args: {
      where: { id: string };
      data: { name?: string; slug?: string };
      select?: Select;
    }) => {
      const record = organizations.find((candidate) => candidate.id === args.where.id);

      if (!record) {
        throw new Error(`Mock organization not found: ${args.where.id}`);
      }

      if (
        args.data.slug !== undefined &&
        organizations.some(
          (candidate) => candidate.slug === args.data.slug && candidate.id !== record.id,
        )
      ) {
        throw await uniqueConstraintError();
      }

      if (args.data.name !== undefined) {
        record.name = args.data.name;
      }

      if (args.data.slug !== undefined) {
        record.slug = args.data.slug;
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
    findMany: async (args: {
      where: { userId?: string; organizationId?: string };
      select?: Select;
    }) => {
      const matches = members.filter((candidate) => {
        if (args.where.userId !== undefined && candidate.userId !== args.where.userId) {
          return false;
        }

        if (
          args.where.organizationId !== undefined &&
          candidate.organizationId !== args.where.organizationId
        ) {
          return false;
        }

        return true;
      });

      return matches.map((candidate) =>
        applySelect(candidate, args.select, {
          organization: (nestedSelect) =>
            selectOrganization(candidate.organizationId, nestedSelect),
          user: (nestedSelect) => selectUser(candidate.userId, nestedSelect),
        }),
      );
    },
    count: async (args: { where: { organizationId: string; role?: StoredMember["role"] } }) => {
      return members.filter((candidate) => {
        if (candidate.organizationId !== args.where.organizationId) {
          return false;
        }

        return args.where.role === undefined || candidate.role === args.where.role;
      }).length;
    },
    delete: async (args: { where: { id: string } }) => {
      const index = members.findIndex((candidate) => candidate.id === args.where.id);

      if (index === -1) {
        throw new Error(`Mock member not found: ${args.where.id}`);
      }

      const [removed] = members.splice(index, 1);

      return removed;
    },
  };

  return {
    reset() {
      users.splice(0, users.length);
      organizations.splice(0, organizations.length);
      members.splice(0, members.length);
      nextId = 1;
    },
    addMember(organizationId: string, userId: string, role: StoredMember["role"]) {
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
    members,
  };
});

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    user: mockDb.user,
    organization: mockDb.organization,
    organizationMember: mockDb.organizationMember,
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

async function createOrganization(
  cookies: string[],
  body: Record<string, unknown> = { name: "Acme Inc" },
) {
  const response = await request(app).post("/organizations").set("Cookie", cookies).send(body);

  expect(response.status).toBe(201);

  return response.body.organization as {
    id: string;
    name: string;
    slug: string;
    role: string;
  };
}

describe("organization routes", () => {
  describe("POST /organizations", () => {
    it("creates an organization and makes the creator OWNER", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");

      const response = await request(app)
        .post("/organizations")
        .set("Cookie", owner.cookies)
        .send({ name: "Acme Inc" });

      expect(response.status).toBe(201);
      expect(response.body.organization).toMatchObject({
        name: "Acme Inc",
        slug: "acme-inc",
        role: "OWNER",
      });
      expect(mockDb.members).toHaveLength(1);
      expect(mockDb.members[0]).toMatchObject({
        userId: owner.id,
        role: "OWNER",
      });
    });

    it("uses a provided slug", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");

      const organization = await createOrganization(owner.cookies, {
        name: "Acme Inc",
        slug: "custom-slug",
      });

      expect(organization.slug).toBe("custom-slug");
    });

    it("rejects a duplicate provided slug", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      await createOrganization(owner.cookies, { name: "Acme Inc", slug: "acme" });

      const response = await request(app)
        .post("/organizations")
        .set("Cookie", owner.cookies)
        .send({ name: "Other Org", slug: "acme" });

      expect(response.status).toBe(409);
      expect(response.body.error.message).toBe("Slug is already in use.");
    });

    it("rejects an unauthenticated request", async () => {
      const response = await request(app).post("/organizations").send({ name: "Acme Inc" });

      expect(response.status).toBe(401);
    });

    it("rejects invalid input", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");

      const response = await request(app)
        .post("/organizations")
        .set("Cookie", owner.cookies)
        .send({ name: "A" });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("Invalid request body");
    });
  });

  describe("GET /organizations", () => {
    it("returns only organizations the user belongs to", async () => {
      const alice = await signupUser("Alice Example", "alice@example.com");
      const bob = await signupUser("Bob Example", "bob@example.com");

      const aliceOrg = await createOrganization(alice.cookies, { name: "Alice Org" });
      await createOrganization(bob.cookies, { name: "Bob Org" });

      const response = await request(app).get("/organizations").set("Cookie", alice.cookies);

      expect(response.status).toBe(200);
      expect(response.body.organizations).toHaveLength(1);
      expect(response.body.organizations[0]).toMatchObject({
        id: aliceOrg.id,
        name: "Alice Org",
        role: "OWNER",
      });
    });
  });

  describe("GET /organizations/:organizationId", () => {
    it("returns the organization with the member's role", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .get(`/organizations/${organization.id}`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(response.body.organization).toMatchObject({
        id: organization.id,
        name: "Acme Inc",
        role: "OWNER",
      });
    });

    it("returns 404 for a non-member", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .get(`/organizations/${organization.id}`)
        .set("Cookie", outsider.cookies);

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe("Organization not found");
    });
  });

  describe("PATCH /organizations/:organizationId", () => {
    it("allows OWNER to update", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .patch(`/organizations/${organization.id}`)
        .set("Cookie", owner.cookies)
        .send({ name: "Renamed Org" });

      expect(response.status).toBe(200);
      expect(response.body.organization.name).toBe("Renamed Org");
    });

    it("allows ADMIN to update", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const admin = await signupUser("Admin Example", "admin@example.com");
      const organization = await createOrganization(owner.cookies);

      mockDb.addMember(organization.id, admin.id, "ADMIN");

      const response = await request(app)
        .patch(`/organizations/${organization.id}`)
        .set("Cookie", admin.cookies)
        .send({ name: "Admin Renamed" });

      expect(response.status).toBe(200);
      expect(response.body.organization.name).toBe("Admin Renamed");
    });

    it("rejects MEMBER with 403", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);

      mockDb.addMember(organization.id, member.id, "MEMBER");

      const response = await request(app)
        .patch(`/organizations/${organization.id}`)
        .set("Cookie", member.cookies)
        .send({ name: "Member Renamed" });

      expect(response.status).toBe(403);
      expect(response.body.error.message).toBe(
        "You do not have permission to perform this action.",
      );
    });

    it("rejects a non-member with 404", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .patch(`/organizations/${organization.id}`)
        .set("Cookie", outsider.cookies)
        .send({ name: "Hijacked" });

      expect(response.status).toBe(404);
    });

    it("rejects an empty body", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .patch(`/organizations/${organization.id}`)
        .set("Cookie", owner.cookies)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe("GET /organizations/:organizationId/members", () => {
    it("returns members with safe user data only", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);

      mockDb.addMember(organization.id, member.id, "MEMBER");

      const response = await request(app)
        .get(`/organizations/${organization.id}/members`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(response.body.members).toHaveLength(2);
      expect(response.body.members[0]).toMatchObject({
        role: "OWNER",
        user: {
          id: owner.id,
          name: "Yashasvi Udayan",
          email: "owner@example.com",
        },
      });
      expect(response.body.members[0].joinedAt).toBeDefined();
      expect(JSON.stringify(response.body)).not.toContain("passwordHash");
    });

    it("returns 404 for a non-member", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .get(`/organizations/${organization.id}/members`)
        .set("Cookie", outsider.cookies);

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /organizations/:organizationId/members/:memberId", () => {
    it("allows OWNER to remove a member", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);

      const membership = mockDb.addMember(organization.id, member.id, "MEMBER");

      const response = await request(app)
        .delete(`/organizations/${organization.id}/members/${membership.id}`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
      expect(mockDb.members).toHaveLength(1);
    });

    it("rejects MEMBER with 403", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);

      const membership = mockDb.addMember(organization.id, member.id, "MEMBER");

      const response = await request(app)
        .delete(`/organizations/${organization.id}/members/${membership.id}`)
        .set("Cookie", member.cookies);

      expect(response.status).toBe(403);
      expect(mockDb.members).toHaveLength(2);
    });

    it("rejects ADMIN with 403", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const admin = await signupUser("Admin Example", "admin@example.com");
      const organization = await createOrganization(owner.cookies);

      const membership = mockDb.addMember(organization.id, admin.id, "ADMIN");

      const response = await request(app)
        .delete(`/organizations/${organization.id}/members/${membership.id}`)
        .set("Cookie", admin.cookies);

      expect(response.status).toBe(403);
    });

    it("rejects an unauthenticated request", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app).delete(
        `/organizations/${organization.id}/members/member_1`,
      );

      expect(response.status).toBe(401);
    });

    it("prevents removing the only OWNER", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const ownerMembership = mockDb.members[0];

      const response = await request(app)
        .delete(`/organizations/${organization.id}/members/${ownerMembership.id}`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("Cannot remove the only owner of an organization.");
      expect(mockDb.members).toHaveLength(1);
    });

    it("returns 404 for a member of a different organization", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const other = await signupUser("Other Example", "other@example.com");
      const organization = await createOrganization(owner.cookies);
      const otherOrganization = await createOrganization(other.cookies, { name: "Other Org" });

      const otherMembership = mockDb.members.find(
        (candidate) => candidate.organizationId === otherOrganization.id,
      );

      const response = await request(app)
        .delete(`/organizations/${organization.id}/members/${otherMembership?.id}`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe("Member not found");
    });
  });
});

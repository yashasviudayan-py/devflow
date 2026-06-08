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

  type Select = Partial<Record<keyof StoredUser, boolean>>;

  const users: StoredUser[] = [];
  let nextId = 1;

  function applySelect(user: StoredUser, select?: Select) {
    if (!select) {
      return user;
    }

    return Object.fromEntries(
      Object.entries(select)
        .filter(([, shouldInclude]) => shouldInclude)
        .map(([key]) => [key, user[key as keyof StoredUser]]),
    );
  }

  const findUnique = vi.fn(
    async (args: { where: { id?: string; email?: string }; select?: Select }) => {
      const user = users.find((candidate) => {
        return candidate.id === args.where.id || candidate.email === args.where.email;
      });

      return user ? applySelect(user, args.select) : null;
    },
  );

  const create = vi.fn(
    async (args: {
      data: { name: string; email: string; passwordHash: string };
      select?: Select;
    }) => {
      const now = new Date("2026-06-08T00:00:00.000Z");
      const user: StoredUser = {
        id: `user_${nextId}`,
        name: args.data.name,
        email: args.data.email,
        passwordHash: args.data.passwordHash,
        createdAt: now,
        updatedAt: now,
      };

      nextId += 1;
      users.push(user);

      return applySelect(user, args.select);
    },
  );

  return {
    reset() {
      users.splice(0, users.length);
      nextId = 1;
      findUnique.mockClear();
      create.mockClear();
    },
    user: {
      create,
      findUnique,
    },
    users,
  };
});

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    user: mockDb.user,
  },
}));

let app: Express;

beforeAll(async () => {
  ({ app } = await import("../app.js"));
});

beforeEach(() => {
  mockDb.reset();
});

function getSetCookieHeader(response: request.Response) {
  const cookies = response.headers["set-cookie"];

  expect(cookies).toBeDefined();

  return cookies as unknown as string[];
}

describe("auth routes", () => {
  describe("POST /auth/signup", () => {
    it("creates user successfully", async () => {
      const response = await request(app).post("/auth/signup").send({
        name: "Yashasvi Udayan",
        email: " YASHASVI@example.COM ",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body.user).toMatchObject({
        id: "user_1",
        name: "Yashasvi Udayan",
        email: "yashasvi@example.com",
      });
      expect(response.body.user.createdAt).toBe("2026-06-08T00:00:00.000Z");
      expect(getSetCookieHeader(response).join(";")).toContain("HttpOnly");
    });

    it("rejects duplicate email", async () => {
      await request(app).post("/auth/signup").send({
        name: "Yashasvi Udayan",
        email: "yashasvi@example.com",
        password: "password123",
      });

      const response = await request(app).post("/auth/signup").send({
        name: "Yashasvi Udayan",
        email: " YASHASVI@example.COM ",
        password: "password123",
      });

      expect(response.status).toBe(409);
      expect(response.body.error.message).toBe("Email is already in use.");
    });

    it("rejects invalid input", async () => {
      const response = await request(app).post("/auth/signup").send({
        name: "Y",
        email: "not-an-email",
        password: "short",
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("Invalid request body");
    });

    it("does not return passwordHash", async () => {
      const response = await request(app).post("/auth/signup").send({
        name: "Yashasvi Udayan",
        email: "yashasvi@example.com",
        password: "password123",
      });

      expect(response.body.user).not.toHaveProperty("passwordHash");
    });
  });

  describe("POST /auth/login", () => {
    it("logs in valid user", async () => {
      await request(app).post("/auth/signup").send({
        name: "Yashasvi Udayan",
        email: "yashasvi@example.com",
        password: "password123",
      });

      const response = await request(app).post("/auth/login").send({
        email: " YASHASVI@example.COM ",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        id: "user_1",
        name: "Yashasvi Udayan",
        email: "yashasvi@example.com",
      });
      expect(getSetCookieHeader(response).join(";")).toContain("HttpOnly");
    });

    it("rejects wrong password", async () => {
      await request(app).post("/auth/signup").send({
        name: "Yashasvi Udayan",
        email: "yashasvi@example.com",
        password: "password123",
      });

      const response = await request(app).post("/auth/login").send({
        email: "yashasvi@example.com",
        password: "wrong-password",
      });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toBe("Invalid credentials");
    });

    it("rejects unknown email with a generic error", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "missing@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toBe("Invalid credentials");
    });

    it("does not return passwordHash", async () => {
      await request(app).post("/auth/signup").send({
        name: "Yashasvi Udayan",
        email: "yashasvi@example.com",
        password: "password123",
      });

      const response = await request(app).post("/auth/login").send({
        email: "yashasvi@example.com",
        password: "password123",
      });

      expect(response.body.user).not.toHaveProperty("passwordHash");
    });
  });

  describe("GET /auth/me", () => {
    it("returns user when authenticated", async () => {
      const signupResponse = await request(app).post("/auth/signup").send({
        name: "Yashasvi Udayan",
        email: "yashasvi@example.com",
        password: "password123",
      });

      const response = await request(app)
        .get("/auth/me")
        .set("Cookie", getSetCookieHeader(signupResponse));

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        id: "user_1",
        name: "Yashasvi Udayan",
        email: "yashasvi@example.com",
      });
      expect(response.body.user).not.toHaveProperty("passwordHash");
    });

    it("returns 401 without valid cookie", async () => {
      const response = await request(app).get("/auth/me");

      expect(response.status).toBe(401);
      expect(response.body.error.message).toBe("Not authenticated");
    });
  });

  describe("POST /auth/logout", () => {
    it("clears cookie successfully", async () => {
      const response = await request(app).post("/auth/logout");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
      });
      expect(getSetCookieHeader(response).join(";")).toContain("devflow_auth=;");
    });
  });
});

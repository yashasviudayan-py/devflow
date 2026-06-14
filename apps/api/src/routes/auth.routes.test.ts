import request from "supertest";
import { describe, expect, it } from "vitest";
import { getApp, signupUser } from "../test/harness.js";

function getSetCookieHeader(response: request.Response) {
  const cookies = response.headers["set-cookie"];

  expect(cookies).toBeDefined();

  return cookies as unknown as string[];
}

describe("auth routes", () => {
  describe("POST /auth/signup", () => {
    it("creates user successfully", async () => {
      const app = await getApp();
      const response = await request(app).post("/auth/signup").send({
        name: "Yashasvi Udayan",
        email: " YASHASVI@example.COM ",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body.user).toMatchObject({
        name: "Yashasvi Udayan",
        email: "yashasvi@example.com",
      });
      expect(response.body.user.id).toEqual(expect.any(String));
      expect(response.body.user.createdAt).toEqual(expect.any(String));
      expect(getSetCookieHeader(response).join(";")).toContain("HttpOnly");
    });

    it("rejects duplicate email", async () => {
      const app = await getApp();
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
      const app = await getApp();
      const response = await request(app).post("/auth/signup").send({
        name: "Y",
        email: "not-an-email",
        password: "short",
      });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("Invalid request body");
    });

    it("does not return passwordHash", async () => {
      const app = await getApp();
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
      const app = await getApp();
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
        name: "Yashasvi Udayan",
        email: "yashasvi@example.com",
      });
      expect(getSetCookieHeader(response).join(";")).toContain("HttpOnly");
    });

    it("rejects wrong password", async () => {
      const app = await getApp();
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
      const app = await getApp();
      const response = await request(app).post("/auth/login").send({
        email: "missing@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toBe("Invalid credentials");
    });

    it("does not return passwordHash", async () => {
      const app = await getApp();
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
      const app = await getApp();
      const user = await signupUser("Yashasvi Udayan", "yashasvi@example.com");

      const response = await request(app).get("/auth/me").set("Cookie", user.cookies);

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        id: user.id,
        name: "Yashasvi Udayan",
        email: "yashasvi@example.com",
      });
      expect(response.body.user).not.toHaveProperty("passwordHash");
    });

    it("returns 401 without valid cookie", async () => {
      const app = await getApp();
      const response = await request(app).get("/auth/me");

      expect(response.status).toBe(401);
      expect(response.body.error.message).toBe("Not authenticated");
    });
  });

  describe("POST /auth/logout", () => {
    it("clears cookie successfully", async () => {
      const app = await getApp();
      const response = await request(app).post("/auth/logout");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
      });
      expect(getSetCookieHeader(response).join(";")).toContain("devflow_auth=;");
    });
  });
});

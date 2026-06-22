import request from "supertest";
import { describe, expect, it } from "vitest";
import { getApp } from "../test/harness.js";

// Cross-cutting checks for the standardized error response shape, request-id
// propagation, and request-logging safety. These complement the per-resource
// route tests, which assert their own specific messages/statuses.
describe("standard error handling", () => {
  describe("error response shape", () => {
    it("returns a VALIDATION_ERROR with field-level details for an invalid body", async () => {
      const app = await getApp();
      const response = await request(app).post("/auth/signup").send({
        name: "Y",
        email: "not-an-email",
        password: "short",
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.message).toBe("Invalid request body");
      expect(Array.isArray(response.body.error.details)).toBe(true);
      expect(response.body.error.details.length).toBeGreaterThan(0);
      // Each detail names the offending field and a human-readable message.
      for (const detail of response.body.error.details) {
        expect(typeof detail.field).toBe("string");
        expect(typeof detail.message).toBe("string");
      }
      expect(response.body.error.details.map((d: { field: string }) => d.field)).toContain("email");
    });

    it("returns an UNAUTHORIZED error for an unauthenticated request", async () => {
      const app = await getApp();
      const response = await request(app).get("/auth/me");

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
      expect(response.body.error.message).toBe("Not authenticated");
      // No validation details on a non-validation error.
      expect(response.body.error.details).toBeUndefined();
    });

    it("returns a NOT_FOUND error for an unmatched route", async () => {
      const app = await getApp();
      const response = await request(app).get("/does-not-exist");

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("NOT_FOUND");
      expect(response.body.error.statusCode).toBe(404);
    });

    it("never exposes a stack trace in the error response", async () => {
      const app = await getApp();
      const response = await request(app).get("/auth/me");

      expect(response.body.error.stack).toBeUndefined();
    });
  });

  describe("request id", () => {
    it("adds an X-Request-Id header to every response", async () => {
      const app = await getApp();
      const response = await request(app).get("/health");

      expect(response.headers["x-request-id"]).toEqual(expect.any(String));
      expect(response.headers["x-request-id"].length).toBeGreaterThan(0);
    });

    it("echoes a client-supplied X-Request-Id and includes it in error responses", async () => {
      const app = await getApp();
      const response = await request(app).get("/auth/me").set("X-Request-Id", "trace-abc");

      expect(response.headers["x-request-id"]).toBe("trace-abc");
      expect(response.body.error.requestId).toBe("trace-abc");
    });
  });

  describe("request logging", () => {
    it("does not interfere with a successful response", async () => {
      const app = await getApp();
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ status: "ok" });
    });
  });
});

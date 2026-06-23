import type { Request, Response } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { getApp } from "../test/harness.js";
import { getHealth } from "./health.controller.js";

describe("getHealth", () => {
  it("returns the API health response", () => {
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    getHealth({} as Request, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      status: "ok",
      service: "devflow-api",
    });
  });
});

describe("GET /health", () => {
  it("responds 200 with an ok status (the platform health check path)", async () => {
    const app = await getApp();

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", service: "devflow-api" });
  });

  it("never reflects a wildcard CORS origin when credentials are allowed", async () => {
    const app = await getApp();

    const response = await request(app)
      .get("/health")
      .set("Origin", "https://evil.example.com");

    // A disallowed origin must not be echoed, and "*" must never appear with
    // credentialed requests — that combination is rejected by browsers anyway.
    expect(response.headers["access-control-allow-origin"]).not.toBe("*");
    expect(response.headers["access-control-allow-origin"]).not.toBe(
      "https://evil.example.com",
    );
  });
});

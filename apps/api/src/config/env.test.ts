import { describe, expect, it } from "vitest";
import { loadEnv } from "./env.js";

const validSource = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/devflow?schema=public",
  JWT_SECRET: "a-sufficiently-long-secret",
  API_PORT: "4000",
  WEB_URL: "http://localhost:3000",
  NODE_ENV: "development",
} satisfies NodeJS.ProcessEnv;

describe("loadEnv", () => {
  it("returns a typed config for a valid environment", () => {
    const env = loadEnv(validSource);

    expect(env).toEqual({
      DATABASE_URL: validSource.DATABASE_URL,
      JWT_SECRET: validSource.JWT_SECRET,
      PORT: 4000,
      HOST: "0.0.0.0",
      WEB_URL: "http://localhost:3000",
      CORS_ORIGINS: ["http://localhost:3000"],
      NODE_ENV: "development",
      LOG_LEVEL: "info",
    });
  });

  it("applies defaults for PORT, HOST, WEB_URL, NODE_ENV, and LOG_LEVEL", () => {
    const env = loadEnv({
      DATABASE_URL: validSource.DATABASE_URL,
      JWT_SECRET: validSource.JWT_SECRET,
    });

    expect(env.PORT).toBe(4000);
    expect(env.HOST).toBe("0.0.0.0");
    expect(env.WEB_URL).toBe("http://localhost:3000");
    expect(env.NODE_ENV).toBe("development");
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("prefers PORT over API_PORT (platform-provided port wins)", () => {
    const env = loadEnv({ ...validSource, PORT: "10000", API_PORT: "4000" });

    expect(env.PORT).toBe(10000);
  });

  it("falls back to API_PORT when PORT is unset (local dev convention)", () => {
    const env = loadEnv({ ...validSource, API_PORT: "4500" });

    expect(env.PORT).toBe(4500);
  });

  it("throws a single clear error listing every missing required variable", () => {
    const run = () => loadEnv({});

    expect(run).toThrow(/Invalid environment configuration/);
    expect(run).toThrow(/DATABASE_URL is required/);
    expect(run).toThrow(/JWT_SECRET is required/);
  });

  it("rejects a non-positive port", () => {
    expect(() => loadEnv({ ...validSource, API_PORT: "0" })).toThrow(/must be a positive integer/);
  });

  it("rejects an unknown NODE_ENV", () => {
    expect(() => loadEnv({ ...validSource, NODE_ENV: "staging" })).toThrow(/NODE_ENV must be/);
  });

  it("rejects an unknown LOG_LEVEL", () => {
    expect(() => loadEnv({ ...validSource, LOG_LEVEL: "verbose" })).toThrow(/LOG_LEVEL must be/);
  });

  it("rejects a weak JWT_SECRET in production", () => {
    expect(() => loadEnv({ ...validSource, NODE_ENV: "production", JWT_SECRET: "short" })).toThrow(
      /JWT_SECRET must be a strong secret/,
    );
  });

  it("accepts a strong JWT_SECRET in production", () => {
    const env = loadEnv({
      ...validSource,
      NODE_ENV: "production",
      JWT_SECRET: "this-is-a-long-enough-production-secret",
    });

    expect(env.NODE_ENV).toBe("production");
  });

  describe("CORS_ORIGINS", () => {
    it("includes the web origin plus localhost in development", () => {
      const env = loadEnv({ ...validSource, WEB_URL: "https://app.example.com" });

      expect(env.CORS_ORIGINS).toEqual(["https://app.example.com", "http://localhost:3000"]);
    });

    it("is exactly the web origin in production (no localhost, no wildcard)", () => {
      const env = loadEnv({
        ...validSource,
        NODE_ENV: "production",
        JWT_SECRET: "this-is-a-long-enough-production-secret",
        WEB_URL: "https://app.example.com",
      });

      expect(env.CORS_ORIGINS).toEqual(["https://app.example.com"]);
      expect(env.CORS_ORIGINS).not.toContain("*");
    });

    it("never contains a wildcard origin (incompatible with credentials)", () => {
      const env = loadEnv(validSource);

      expect(env.CORS_ORIGINS).not.toContain("*");
    });
  });
});

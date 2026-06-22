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
      API_PORT: 4000,
      WEB_URL: "http://localhost:3000",
      NODE_ENV: "development",
    });
  });

  it("applies defaults for API_PORT, WEB_URL, and NODE_ENV", () => {
    const env = loadEnv({
      DATABASE_URL: validSource.DATABASE_URL,
      JWT_SECRET: validSource.JWT_SECRET,
    });

    expect(env.API_PORT).toBe(4000);
    expect(env.WEB_URL).toBe("http://localhost:3000");
    expect(env.NODE_ENV).toBe("development");
  });

  it("throws a single clear error listing every missing required variable", () => {
    const run = () => loadEnv({});

    expect(run).toThrow(/Invalid environment configuration/);
    expect(run).toThrow(/DATABASE_URL is required/);
    expect(run).toThrow(/JWT_SECRET is required/);
  });

  it("rejects a non-positive API_PORT", () => {
    expect(() => loadEnv({ ...validSource, API_PORT: "0" })).toThrow(/API_PORT must be/);
  });

  it("rejects an unknown NODE_ENV", () => {
    expect(() => loadEnv({ ...validSource, NODE_ENV: "staging" })).toThrow(/NODE_ENV must be/);
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
});

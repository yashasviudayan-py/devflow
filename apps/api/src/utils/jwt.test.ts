import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import {
  getAuthCookieOptions,
  getClearAuthCookieOptions,
  signAuthToken,
  verifyAuthToken,
} from "./jwt.js";

// JWT_SECRET and NODE_ENV=test are injected by vitest.config.ts.

describe("signAuthToken / verifyAuthToken", () => {
  it("round-trips a userId through a signed token", () => {
    const token = signAuthToken("user-123");

    expect(verifyAuthToken(token)).toEqual({ userId: "user-123" });
  });

  it("returns null for a malformed token", () => {
    expect(verifyAuthToken("not-a-real-token")).toBeNull();
  });

  it("returns null for a token signed with a different secret", () => {
    const forged = jwt.sign({ userId: "user-123" }, "some-other-secret");

    expect(verifyAuthToken(forged)).toBeNull();
  });

  it("returns null when the payload has no string userId", () => {
    const tokenWithoutUserId = jwt.sign({ sub: "user-123" }, "test-jwt-secret");

    expect(verifyAuthToken(tokenWithoutUserId)).toBeNull();
  });

  it("returns null for an expired token", () => {
    const expired = jwt.sign({ userId: "user-123" }, "test-jwt-secret", { expiresIn: -10 });

    expect(verifyAuthToken(expired)).toBeNull();
  });
});

describe("auth cookie options", () => {
  it("sets the auth cookie httpOnly, lax, and not secure outside production", () => {
    const options = getAuthCookieOptions();

    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.secure).toBe(false);
    expect(options.maxAge).toBeGreaterThan(0);
  });

  it("clears the cookie with matching flags and no maxAge", () => {
    const options = getClearAuthCookieOptions();

    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.maxAge).toBeUndefined();
  });
});

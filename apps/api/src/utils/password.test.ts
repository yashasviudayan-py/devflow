import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("password hashing", () => {
  it("produces a hash that is not the plaintext", async () => {
    const hash = await hashPassword("password123");

    expect(hash).not.toBe("password123");
    expect(hash.length).toBeGreaterThan(0);
  });

  it("verifies the correct password against its hash", async () => {
    const hash = await hashPassword("password123");

    await expect(verifyPassword("password123", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("password123");

    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});

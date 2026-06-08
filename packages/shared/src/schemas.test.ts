import { describe, expect, it } from "vitest";
import { createProjectSchema, loginSchema, signupSchema } from "./schemas.js";

describe("signupSchema", () => {
  it("accepts a valid signup payload", () => {
    const parsed = signupSchema.parse({
      name: "Yashasvi Udayan",
      email: " YASHASVI@example.COM ",
      password: "password123",
    });

    expect(parsed).toEqual({
      name: "Yashasvi Udayan",
      email: "yashasvi@example.com",
      password: "password123",
    });
  });

  it("rejects an invalid email", () => {
    expect(() =>
      signupSchema.parse({
        name: "Yashasvi Udayan",
        email: "not-an-email",
        password: "password123",
      }),
    ).toThrow();
  });

  it("rejects a short password", () => {
    expect(() =>
      signupSchema.parse({
        name: "Yashasvi Udayan",
        email: "yashasvi@example.com",
        password: "short",
      }),
    ).toThrow();
  });
});

describe("loginSchema", () => {
  it("accepts a valid login payload", () => {
    const parsed = loginSchema.parse({
      email: " YASHASVI@example.COM ",
      password: "password123",
    });

    expect(parsed).toEqual({
      email: "yashasvi@example.com",
      password: "password123",
    });
  });

  it("rejects a missing password", () => {
    expect(() =>
      loginSchema.parse({
        email: "yashasvi@example.com",
        password: "",
      }),
    ).toThrow();
  });
});

describe("createProjectSchema", () => {
  it("accepts a valid project payload", () => {
    const parsed = createProjectSchema.parse({
      name: "Website redesign",
      description: "Refresh the public marketing site.",
    });

    expect(parsed.name).toBe("Website redesign");
  });

  it("rejects a project name that is too short", () => {
    expect(() => createProjectSchema.parse({ name: "A" })).toThrow();
  });
});

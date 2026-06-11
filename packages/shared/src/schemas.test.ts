import { describe, expect, it } from "vitest";
import {
  createOrganizationSchema,
  createProjectSchema,
  loginSchema,
  signupSchema,
  updateOrganizationSchema,
} from "./schemas.js";

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

describe("createOrganizationSchema", () => {
  it("accepts a valid payload without a slug", () => {
    const parsed = createOrganizationSchema.parse({
      name: "  Acme Inc  ",
    });

    expect(parsed).toEqual({
      name: "Acme Inc",
    });
  });

  it("accepts a valid payload with a slug and lowercases it", () => {
    const parsed = createOrganizationSchema.parse({
      name: "Acme Inc",
      slug: "ACME-Inc",
    });

    expect(parsed.slug).toBe("acme-inc");
  });

  it("rejects a missing name", () => {
    expect(() => createOrganizationSchema.parse({})).toThrow();
  });

  it("rejects a name that is too short", () => {
    expect(() => createOrganizationSchema.parse({ name: "A" })).toThrow();
  });

  it("rejects a slug with invalid characters", () => {
    expect(() =>
      createOrganizationSchema.parse({
        name: "Acme Inc",
        slug: "acme inc!",
      }),
    ).toThrow();
  });
});

describe("updateOrganizationSchema", () => {
  it("accepts a name-only update", () => {
    const parsed = updateOrganizationSchema.parse({ name: "New Name" });

    expect(parsed).toEqual({ name: "New Name" });
  });

  it("accepts a slug-only update", () => {
    const parsed = updateOrganizationSchema.parse({ slug: "new-slug" });

    expect(parsed).toEqual({ slug: "new-slug" });
  });

  it("rejects an empty update", () => {
    expect(() => updateOrganizationSchema.parse({})).toThrow();
  });

  it("rejects an invalid slug", () => {
    expect(() => updateOrganizationSchema.parse({ slug: "-bad-" })).toThrow();
  });
});

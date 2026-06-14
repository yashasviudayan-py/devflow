import { describe, expect, it } from "vitest";
import {
  createOrganizationSchema,
  createProjectSchema,
  createTaskSchema,
  loginSchema,
  signupSchema,
  taskFilterSchema,
  updateOrganizationSchema,
  updateProjectSchema,
  updateTaskSchema,
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

describe("updateProjectSchema", () => {
  it("accepts a name-only update", () => {
    const parsed = updateProjectSchema.parse({ name: "Renamed project" });

    expect(parsed).toEqual({ name: "Renamed project" });
  });

  it("accepts an archived-only update", () => {
    const parsed = updateProjectSchema.parse({ archived: true });

    expect(parsed).toEqual({ archived: true });
  });

  it("rejects an empty update", () => {
    expect(() => updateProjectSchema.parse({})).toThrow();
  });

  it("rejects a name that is too short", () => {
    expect(() => updateProjectSchema.parse({ name: "A" })).toThrow();
  });
});

describe("createTaskSchema", () => {
  it("accepts a minimal task payload", () => {
    const parsed = createTaskSchema.parse({ title: "  Write the docs  " });

    expect(parsed).toEqual({ title: "Write the docs" });
  });

  it("accepts a full task payload and coerces the due date", () => {
    const parsed = createTaskSchema.parse({
      title: "Ship the API",
      description: "Implement the tasks endpoints.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      assigneeId: "user_1",
      dueDate: "2026-07-01T00:00:00.000Z",
    });

    expect(parsed.status).toBe("IN_PROGRESS");
    expect(parsed.priority).toBe("HIGH");
    expect(parsed.dueDate).toBeInstanceOf(Date);
  });

  it("rejects an empty title", () => {
    expect(() => createTaskSchema.parse({ title: "   " })).toThrow();
  });

  it("rejects an unknown status", () => {
    expect(() => createTaskSchema.parse({ title: "Task", status: "BLOCKED" })).toThrow();
  });
});

describe("updateTaskSchema", () => {
  it("accepts a status-only update", () => {
    const parsed = updateTaskSchema.parse({ status: "DONE" });

    expect(parsed).toEqual({ status: "DONE" });
  });

  it("allows clearing the assignee and due date with null", () => {
    const parsed = updateTaskSchema.parse({ assigneeId: null, dueDate: null });

    expect(parsed).toEqual({ assigneeId: null, dueDate: null });
  });

  it("rejects an empty update", () => {
    expect(() => updateTaskSchema.parse({})).toThrow();
  });

  it("rejects an unknown priority", () => {
    expect(() => updateTaskSchema.parse({ priority: "SOMEDAY" })).toThrow();
  });
});

describe("taskFilterSchema", () => {
  it("strips unknown query keys", () => {
    const parsed = taskFilterSchema.parse({ status: "TODO", search: "anything" });

    expect(parsed).toEqual({ status: "TODO" });
  });

  it("rejects an invalid status filter", () => {
    expect(() => taskFilterSchema.parse({ status: "NOPE" })).toThrow();
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

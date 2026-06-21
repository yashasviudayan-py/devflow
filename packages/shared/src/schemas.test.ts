import { describe, expect, it } from "vitest";
import {
  createCommentSchema,
  createOrganizationSchema,
  createProjectSchema,
  createTaskSchema,
  listNotificationsQuerySchema,
  listProjectsQuerySchema,
  listTasksQuerySchema,
  loginSchema,
  signupSchema,
  taskFilterSchema,
  updateCommentSchema,
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

describe("listProjectsQuerySchema", () => {
  it("accepts search, sort, and pagination params", () => {
    const parsed = listProjectsQuerySchema.parse({
      q: "  redesign  ",
      sortBy: "name",
      sortOrder: "desc",
      limit: "10",
      cursor: "abc",
    });

    expect(parsed).toEqual({
      q: "redesign",
      sortBy: "name",
      sortOrder: "desc",
      limit: 10,
      cursor: "abc",
    });
  });

  it("accepts an empty query (all params optional)", () => {
    expect(listProjectsQuerySchema.parse({})).toEqual({});
  });

  it("rejects a sortBy outside the allow-list", () => {
    expect(() => listProjectsQuerySchema.parse({ sortBy: "description" })).toThrow();
  });

  it("rejects an invalid sortOrder", () => {
    expect(() => listProjectsQuerySchema.parse({ sortOrder: "sideways" })).toThrow();
  });

  it("rejects a limit above the maximum", () => {
    expect(() => listProjectsQuerySchema.parse({ limit: "101" })).toThrow();
  });

  it("rejects a search query that is too long", () => {
    expect(() => listProjectsQuerySchema.parse({ q: "a".repeat(201) })).toThrow();
  });
});

describe("listTasksQuerySchema", () => {
  it("accepts filters, dates, sort, and pagination params", () => {
    const parsed = listTasksQuerySchema.parse({
      q: "bug",
      status: "IN_REVIEW",
      priority: "URGENT",
      assigneeId: "user_1",
      dueAfter: "2026-01-01T00:00:00.000Z",
      dueBefore: "2026-12-31T00:00:00.000Z",
      sortBy: "dueDate",
      sortOrder: "asc",
      limit: "25",
    });

    expect(parsed.status).toBe("IN_REVIEW");
    expect(parsed.priority).toBe("URGENT");
    expect(parsed.assigneeId).toBe("user_1");
    expect(parsed.dueAfter).toBeInstanceOf(Date);
    expect(parsed.dueBefore).toBeInstanceOf(Date);
    expect(parsed.sortBy).toBe("dueDate");
    expect(parsed.limit).toBe(25);
  });

  it("parses the unassigned boolean from its string form", () => {
    expect(listTasksQuerySchema.parse({ unassigned: "true" }).unassigned).toBe(true);
    expect(listTasksQuerySchema.parse({ unassigned: "false" }).unassigned).toBe(false);
  });

  it("rejects a non-boolean unassigned value", () => {
    expect(() => listTasksQuerySchema.parse({ unassigned: "maybe" })).toThrow();
  });

  it("rejects an invalid due date", () => {
    expect(() => listTasksQuerySchema.parse({ dueBefore: "not-a-date" })).toThrow();
  });

  it("rejects a sortBy outside the allow-list", () => {
    expect(() => listTasksQuerySchema.parse({ sortBy: "assigneeId" })).toThrow();
  });

  it("rejects an invalid status filter", () => {
    expect(() => listTasksQuerySchema.parse({ status: "NOPE" })).toThrow();
  });
});

describe("listNotificationsQuerySchema", () => {
  it("parses unreadOnly alongside pagination", () => {
    const parsed = listNotificationsQuerySchema.parse({ unreadOnly: "true", limit: "5" });

    expect(parsed).toEqual({ unreadOnly: true, limit: 5 });
  });

  it("rejects a non-boolean unreadOnly value", () => {
    expect(() => listNotificationsQuerySchema.parse({ unreadOnly: "1" })).toThrow();
  });
});

describe("createCommentSchema", () => {
  it("accepts a comment and trims surrounding whitespace", () => {
    const parsed = createCommentSchema.parse({ body: "  Looks good to me  " });

    expect(parsed).toEqual({ body: "Looks good to me" });
  });

  it("rejects an empty comment", () => {
    expect(() => createCommentSchema.parse({ body: "   " })).toThrow();
  });

  it("rejects a comment that exceeds the maximum length", () => {
    expect(() => createCommentSchema.parse({ body: "a".repeat(5001) })).toThrow();
  });
});

describe("updateCommentSchema", () => {
  it("accepts an updated comment body", () => {
    const parsed = updateCommentSchema.parse({ body: "Edited comment" });

    expect(parsed).toEqual({ body: "Edited comment" });
  });

  it("rejects an empty comment", () => {
    expect(() => updateCommentSchema.parse({ body: "" })).toThrow();
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

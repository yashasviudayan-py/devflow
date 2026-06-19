import { describe, expect, it } from "vitest";
import { activityActorName, describeActivity } from "./activity-format";
import type { ActivityLog } from "./api";

function makeLog(overrides: Partial<ActivityLog>): ActivityLog {
  return {
    id: "activity-1",
    organizationId: "org-1",
    projectId: "project-1",
    taskId: "task-1",
    actorId: "user-1",
    action: "TASK_CREATED",
    entityType: "TASK",
    entityId: "task-1",
    metadata: null,
    createdAt: "2026-06-19T00:00:00.000Z",
    actor: { id: "user-1", name: "Yashasvi", email: "yashasvi@example.com" },
    ...overrides,
  };
}

describe("activityActorName", () => {
  it("returns the actor name", () => {
    expect(activityActorName(makeLog({}))).toBe("Yashasvi");
  });

  it("falls back to a placeholder when the actor was removed", () => {
    expect(activityActorName(makeLog({ actor: null, actorId: null }))).toBe("Unknown user");
  });
});

describe("describeActivity", () => {
  const task = { context: "task" as const };

  it("describes task creation", () => {
    expect(describeActivity(makeLog({ action: "TASK_CREATED" }), task)).toBe("created this task");
  });

  it("describes a status change with readable labels", () => {
    const log = makeLog({
      action: "TASK_STATUS_CHANGED",
      metadata: { from: "TODO", to: "IN_PROGRESS" },
    });
    expect(describeActivity(log, task)).toBe("moved this task from To do to In progress");
  });

  it("describes a priority change with readable labels", () => {
    const log = makeLog({
      action: "TASK_PRIORITY_CHANGED",
      metadata: { from: "MEDIUM", to: "HIGH" },
    });
    expect(describeActivity(log, task)).toBe("changed priority from Medium to High");
  });

  it("resolves the assignee name when a lookup is provided", () => {
    const log = makeLog({ action: "TASK_ASSIGNED", metadata: { from: null, to: "user-2" } });
    const message = describeActivity(log, {
      context: "task",
      resolveUserName: (id) => (id === "user-2" ? "Alex" : undefined),
    });
    expect(message).toBe("assigned this task to Alex");
  });

  it("falls back to 'a member' when the assignee name cannot be resolved", () => {
    const log = makeLog({ action: "TASK_ASSIGNED", metadata: { to: "user-2" } });
    expect(describeActivity(log, task)).toBe("assigned this task to a member");
  });

  it("describes an unassignment", () => {
    expect(describeActivity(makeLog({ action: "TASK_UNASSIGNED" }), task)).toBe(
      "unassigned this task",
    );
  });

  it("describes comment events", () => {
    expect(describeActivity(makeLog({ action: "COMMENT_CREATED" }), task)).toBe("added a comment");
    expect(describeActivity(makeLog({ action: "COMMENT_UPDATED" }), task)).toBe("edited a comment");
    expect(describeActivity(makeLog({ action: "COMMENT_DELETED" }), task)).toBe(
      "deleted a comment",
    );
  });

  it("uses 'a task' phrasing in a project feed", () => {
    expect(describeActivity(makeLog({ action: "TASK_CREATED" }), { context: "project" })).toBe(
      "created a task",
    );
  });

  it("describes project events", () => {
    expect(
      describeActivity(makeLog({ action: "PROJECT_CREATED", entityType: "PROJECT" }), {
        context: "project",
      }),
    ).toBe("created the project");
    expect(
      describeActivity(makeLog({ action: "PROJECT_ARCHIVED", entityType: "PROJECT" }), {
        context: "project",
      }),
    ).toBe("archived the project");
  });

  it("handles missing metadata without throwing", () => {
    const log = makeLog({ action: "TASK_STATUS_CHANGED", metadata: null });
    expect(describeActivity(log, task)).toBe("moved this task from Unknown to Unknown");
  });

  it("falls back gracefully for an unknown action", () => {
    const log = makeLog({ action: "SOMETHING_NEW" as ActivityLog["action"] });
    expect(describeActivity(log, task)).toBe("performed an action");
  });
});

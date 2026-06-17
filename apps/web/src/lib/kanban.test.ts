import { describe, expect, it } from "vitest";
import type { Task } from "./api";
import { boardColumns, groupTasksByStatus } from "./kanban";

function makeTask(id: string, status: Task["status"]): Task {
  return {
    id,
    projectId: "project-1",
    reporterId: "user-1",
    assigneeId: null,
    title: `Task ${id}`,
    description: null,
    status,
    priority: "MEDIUM",
    dueDate: null,
    archivedAt: null,
    createdAt: "2026-06-08T00:00:00.000Z",
    updatedAt: "2026-06-08T00:00:00.000Z",
    assignee: null,
    reporter: { id: "user-1", name: "Test User", email: "test@example.com" },
  };
}

describe("boardColumns", () => {
  it("exposes the four board statuses with friendly labels", () => {
    expect(boardColumns.map((column) => column.status)).toEqual([
      "TODO",
      "IN_PROGRESS",
      "IN_REVIEW",
      "DONE",
    ]);
    expect(boardColumns.map((column) => column.label)).toEqual([
      "Todo",
      "In Progress",
      "In Review",
      "Done",
    ]);
  });
});

describe("groupTasksByStatus", () => {
  it("groups tasks into their status columns, preserving order", () => {
    const tasks = [
      makeTask("a", "TODO"),
      makeTask("b", "IN_PROGRESS"),
      makeTask("c", "TODO"),
      makeTask("d", "DONE"),
      makeTask("e", "IN_REVIEW"),
    ];

    const grouped = groupTasksByStatus(tasks);

    expect(grouped.TODO.map((task) => task.id)).toEqual(["a", "c"]);
    expect(grouped.IN_PROGRESS.map((task) => task.id)).toEqual(["b"]);
    expect(grouped.IN_REVIEW.map((task) => task.id)).toEqual(["e"]);
    expect(grouped.DONE.map((task) => task.id)).toEqual(["d"]);
  });

  it("returns empty arrays for columns with no tasks", () => {
    const grouped = groupTasksByStatus([]);

    expect(grouped.TODO).toEqual([]);
    expect(grouped.IN_PROGRESS).toEqual([]);
    expect(grouped.IN_REVIEW).toEqual([]);
    expect(grouped.DONE).toEqual([]);
  });

  it("omits tasks whose status has no board column (CANCELED)", () => {
    const grouped = groupTasksByStatus([makeTask("a", "CANCELED"), makeTask("b", "TODO")]);

    expect(grouped.TODO.map((task) => task.id)).toEqual(["b"]);
    expect(Object.values(grouped).flat()).toHaveLength(1);
  });
});

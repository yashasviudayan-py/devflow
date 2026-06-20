import { describe, expect, it } from "vitest";
import type { Notification } from "./api";
import {
  notificationActorName,
  notificationHref,
  notificationMessage,
  notificationTitle,
  unreadCount,
} from "./notification-format";

function makeNotification(overrides: Partial<Notification>): Notification {
  return {
    id: "notification-1",
    userId: "user-1",
    actorId: "user-2",
    type: "TASK_ASSIGNED",
    title: "Task assigned to you",
    message: 'Alex assigned you "Write the docs"',
    readAt: null,
    data: { taskId: "task-1", projectId: "project-1", organizationId: "org-1" },
    createdAt: "2026-06-20T00:00:00.000Z",
    updatedAt: "2026-06-20T00:00:00.000Z",
    actor: { id: "user-2", name: "Alex", email: "alex@example.com" },
    ...overrides,
  };
}

describe("notificationActorName", () => {
  it("returns the actor name", () => {
    expect(notificationActorName(makeNotification({}))).toBe("Alex");
  });

  it("falls back to a placeholder when the actor was removed", () => {
    expect(notificationActorName(makeNotification({ actor: null, actorId: null }))).toBe("Someone");
  });
});

describe("notificationTitle / notificationMessage", () => {
  it("prefers the server-provided strings", () => {
    const notification = makeNotification({ title: "Custom title", message: "Custom message" });
    expect(notificationTitle(notification)).toBe("Custom title");
    expect(notificationMessage(notification)).toBe("Custom message");
  });

  it("falls back to per-type text when title/message are empty", () => {
    const notification = makeNotification({
      type: "TASK_STATUS_CHANGED",
      title: "",
      message: "",
    });
    expect(notificationTitle(notification)).toBe("A task assigned to you changed status.");
    expect(notificationMessage(notification)).toBe("A task assigned to you changed status.");
  });

  it("falls back gracefully for an unknown type", () => {
    const notification = makeNotification({
      type: "SOMETHING_NEW" as Notification["type"],
      title: "",
      message: "",
    });
    expect(notificationTitle(notification)).toBe("You have a new notification.");
    expect(notificationMessage(notification)).toBe("You have a new notification.");
  });
});

describe("notificationHref", () => {
  it("links to the task when a taskId is present (most specific first)", () => {
    expect(notificationHref(makeNotification({}))).toBe("/tasks/task-1");
  });

  it("links to the project when there is no taskId", () => {
    const notification = makeNotification({ data: { projectId: "project-1" } });
    expect(notificationHref(notification)).toBe("/projects/project-1");
  });

  it("links to the organization when only an organizationId is present", () => {
    const notification = makeNotification({ data: { organizationId: "org-1" } });
    expect(notificationHref(notification)).toBe("/organizations/org-1");
  });

  it("returns null when data is missing or has no usable ids", () => {
    expect(notificationHref(makeNotification({ data: null }))).toBeNull();
    expect(notificationHref(makeNotification({ data: { taskId: 42 } }))).toBeNull();
  });
});

describe("unreadCount", () => {
  it("counts only notifications with a null readAt", () => {
    const notifications = [
      makeNotification({ id: "a", readAt: null }),
      makeNotification({ id: "b", readAt: "2026-06-20T01:00:00.000Z" }),
      makeNotification({ id: "c", readAt: null }),
    ];
    expect(unreadCount(notifications)).toBe(2);
  });

  it("returns 0 for an empty list", () => {
    expect(unreadCount([])).toBe(0);
  });
});

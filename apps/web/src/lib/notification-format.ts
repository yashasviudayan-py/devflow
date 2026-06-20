import type { NotificationType } from "@devflow/shared";
import type { Notification } from "./api";

// Matches the convention for a removed/unknown actor used elsewhere, kept generic
// since a notification's actor is the person who triggered it.
const UNKNOWN_ACTOR = "Someone";

// Readable fallback text per type, used only when the API does not supply a
// title/message. The API already sends well-formed strings today, so these are a
// safety net; declaring them as a full Record keeps them in sync with the enum.
const typeText: Record<NotificationType, string> = {
  TASK_ASSIGNED: "You were assigned a task.",
  TASK_STATUS_CHANGED: "A task assigned to you changed status.",
  TASK_PRIORITY_CHANGED: "A task assigned to you changed priority.",
  COMMENT_ADDED: "Someone commented on your task.",
  MENTION: "You were mentioned.",
  DUE_DATE_REMINDER: "A task is due soon.",
  PROJECT_UPDATED: "A project was updated.",
};

// Looked up via a plain-string index so an unknown/future type from the backend
// falls back gracefully instead of yielding undefined.
function fallbackText(type: string): string {
  return (typeText as Record<string, string>)[type] ?? "You have a new notification.";
}

export function notificationActorName(notification: Notification): string {
  return notification.actor?.name ?? UNKNOWN_ACTOR;
}

// Prefer the server-provided strings; fall back to per-type text so the UI never
// renders blank, even for a type this build does not know about.
export function notificationTitle(notification: Notification): string {
  return notification.title || fallbackText(notification.type);
}

export function notificationMessage(notification: Notification): string {
  return notification.message || fallbackText(notification.type);
}

// `data` shape varies by type, so values are read defensively: a missing or
// non-string value yields null and the caller falls back gracefully.
function readString(data: Notification["data"], key: string): string | null {
  if (!data) {
    return null;
  }
  const value = data[key];
  return typeof value === "string" ? value : null;
}

/**
 * Resolves the in-app destination for a notification from its `data`, in order of
 * specificity: task → project → organization. Returns null when there is not
 * enough metadata to link anywhere, so the item renders as non-navigable.
 */
export function notificationHref(notification: Notification): string | null {
  const taskId = readString(notification.data, "taskId");
  if (taskId) {
    return `/tasks/${taskId}`;
  }

  const projectId = readString(notification.data, "projectId");
  if (projectId) {
    return `/projects/${projectId}`;
  }

  const organizationId = readString(notification.data, "organizationId");
  if (organizationId) {
    return `/organizations/${organizationId}`;
  }

  return null;
}

// Number of unread notifications in a list. Used to keep the page's unread summary
// in sync as items are marked read or deleted without an extra round-trip.
export function unreadCount(notifications: Notification[]): number {
  return notifications.filter((notification) => notification.readAt === null).length;
}

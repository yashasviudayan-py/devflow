export const userRoles = ["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const;
export type UserRole = (typeof userRoles)[number];

export const taskStatuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELED"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const taskPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type TaskPriority = (typeof taskPriorities)[number];

// Activity logs are written exclusively by the server (never from user input), so
// these are plain shared unions rather than Zod schemas. They mirror the
// `ActivityAction` / `ActivityEntityType` enums in the Prisma schema.
export const activityActions = [
  "PROJECT_CREATED",
  "PROJECT_UPDATED",
  "PROJECT_ARCHIVED",
  "TASK_CREATED",
  "TASK_UPDATED",
  "TASK_STATUS_CHANGED",
  "TASK_PRIORITY_CHANGED",
  "TASK_ASSIGNED",
  "TASK_UNASSIGNED",
  "TASK_ARCHIVED",
  "COMMENT_CREATED",
  "COMMENT_UPDATED",
  "COMMENT_DELETED",
] as const;
export type ActivityAction = (typeof activityActions)[number];

export const activityEntityTypes = ["PROJECT", "TASK", "COMMENT"] as const;
export type ActivityEntityType = (typeof activityEntityTypes)[number];

// Notifications are created exclusively by the server in response to user events
// (assignment, status/priority changes, comments), never from user input, so this
// is a plain shared union rather than a Zod schema. It mirrors the
// `NotificationType` enum in the Prisma schema. `MENTION`, `DUE_DATE_REMINDER`, and
// `PROJECT_UPDATED` exist in the schema for future use but are not emitted yet.
export const notificationTypes = [
  "TASK_ASSIGNED",
  "TASK_STATUS_CHANGED",
  "TASK_PRIORITY_CHANGED",
  "MENTION",
  "COMMENT_ADDED",
  "DUE_DATE_REMINDER",
  "PROJECT_UPDATED",
] as const;
export type NotificationType = (typeof notificationTypes)[number];

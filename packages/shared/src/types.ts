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

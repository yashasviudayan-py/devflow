export const userRoles = ["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const;
export type UserRole = (typeof userRoles)[number];

export const taskStatuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELED"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const taskPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type TaskPriority = (typeof taskPriorities)[number];

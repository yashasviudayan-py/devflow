import type {
  ActivityAction,
  ActivityEntityType,
  CreateCommentInput,
  CreateOrganizationInput,
  CreateProjectInput,
  CreateTaskInput,
  LoginInput,
  NotificationType,
  SignupInput,
  TaskPriority,
  TaskStatus,
  UpdateCommentInput,
  UpdateProjectInput,
  UpdateTaskInput,
  UserRole,
} from "@devflow/shared";
import {
  buildQueryString,
  type ProjectSortField,
  type SortOrder,
  type TaskSortField,
} from "@/lib/listQuery";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationWithRole = Organization & {
  role: UserRole;
};

export type Project = {
  id: string;
  organizationId: string;
  createdById: string;
  name: string;
  // The API stores description as a nullable column, so it can come back as null.
  description: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationMember = {
  id: string;
  role: UserRole;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

// Nested assignee/reporter objects expose only safe, public fields — the API
// never returns passwordHash or other sensitive user data.
export type TaskUser = {
  id: string;
  name: string;
  email: string;
};

export type Task = {
  id: string;
  projectId: string;
  reporterId: string;
  // Nullable columns can come back as null from the API.
  assigneeId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // The creator (reporter) is always present; assignee is null when unassigned.
  assignee: TaskUser | null;
  reporter: TaskUser | null;
};

// A comment on a task. The nested author exposes only safe, public fields and is
// null when the author's account was removed (the API sets authorId via SetNull).
export type Comment = {
  id: string;
  taskId: string;
  authorId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: TaskUser | null;
};

// A server-written audit log entry. The nested actor exposes only safe, public
// fields and is null when the actor's account was removed (the API sets actorId
// via SetNull). `metadata` is a small, action-specific JSON object (e.g. old/new
// values); the UI reads it defensively since its shape varies by action.
export type ActivityLog = {
  id: string;
  organizationId: string;
  projectId: string | null;
  taskId: string | null;
  actorId: string | null;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: TaskUser | null;
};

// A server-created notification addressed to the current user. The nested actor
// (who triggered it) exposes only safe, public fields and is null when that
// account was removed (the API sets actorId via SetNull). `data` is a small JSON
// object with deep-link context (taskId/projectId/organizationId) plus any
// relevant old/new values; the UI reads it defensively since its shape varies by
// type. `readAt` is null while the notification is unread.
export type Notification = {
  id: string;
  userId: string;
  actorId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  readAt: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  actor: TaskUser | null;
};

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

const DEFAULT_API_URL = "http://localhost:4000";

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

type ApiErrorBody = {
  error?: {
    message?: string;
  };
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      // The API session lives in an HTTP-only cookie, so every request must
      // opt in to sending credentials across the web/API origins.
      credentials: "include",
      headers: {
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("Unable to reach the DevFlow API. Is the backend running?", 0);
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message = (data as ApiErrorBody | null)?.error?.message ?? "Something went wrong.";
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export async function signup(input: SignupInput): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return data.user;
}

export async function login(input: LoginInput): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return data.user;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>("/auth/me");

  return data.user;
}

export async function logout(): Promise<void> {
  await request<{ success: boolean }>("/auth/logout", {
    method: "POST",
  });
}

export async function getOrganizations(): Promise<OrganizationWithRole[]> {
  const data = await request<{ organizations: OrganizationWithRole[] }>("/organizations");

  return data.organizations;
}

export async function createOrganization(
  input: CreateOrganizationInput,
): Promise<OrganizationWithRole> {
  const data = await request<{ organization: OrganizationWithRole }>("/organizations", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return data.organization;
}

export async function getOrganization(organizationId: string): Promise<OrganizationWithRole> {
  const data = await request<{ organization: OrganizationWithRole }>(
    `/organizations/${organizationId}`,
  );

  return data.organization;
}

export async function getOrganizationMembers(
  organizationId: string,
): Promise<OrganizationMember[]> {
  const data = await request<{ members: OrganizationMember[] }>(
    `/organizations/${organizationId}/members`,
  );

  return data.members;
}

// Cursor-paginated list envelope returned by the project/task list endpoints.
// `nextCursor` is null on the final page; pass it back as `cursor` for the next.
export type ProjectsPage = {
  projects: Project[];
  nextCursor: string | null;
};

export type ListProjectsParams = {
  q?: string;
  limit?: number;
  cursor?: string;
  sortBy?: ProjectSortField;
  sortOrder?: SortOrder;
};

export async function getOrganizationProjects(
  organizationId: string,
  params: ListProjectsParams = {},
): Promise<ProjectsPage> {
  // Empty params are omitted by buildQueryString, so a bare call sends no query.
  const query = buildQueryString({
    q: params.q,
    limit: params.limit,
    cursor: params.cursor,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  return request<ProjectsPage>(`/organizations/${organizationId}/projects${query}`);
}

export async function createProject(
  organizationId: string,
  input: CreateProjectInput,
): Promise<Project> {
  const data = await request<{ project: Project }>(
    `/organizations/${organizationId}/projects`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  return data.project;
}

export async function getProject(projectId: string): Promise<Project> {
  const data = await request<{ project: Project }>(`/projects/${projectId}`);

  return data.project;
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const data = await request<{ project: Project }>(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return data.project;
}

export async function deleteProject(projectId: string): Promise<void> {
  // The API soft-archives on DELETE and responds with { success: true }.
  await request<{ success: boolean }>(`/projects/${projectId}`, {
    method: "DELETE",
  });
}

export type TasksPage = {
  tasks: Task[];
  nextCursor: string | null;
};

export type ListTasksParams = {
  q?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  unassigned?: boolean;
  // ISO date strings (the API accepts `YYYY-MM-DD` and coerces to a Date).
  dueBefore?: string;
  dueAfter?: string;
  limit?: number;
  cursor?: string;
  sortBy?: TaskSortField;
  sortOrder?: SortOrder;
};

export async function getProjectTasks(
  projectId: string,
  params: ListTasksParams = {},
): Promise<TasksPage> {
  // The API validates each value; buildQueryString forwards only the ones set.
  // `unassigned` is sent only when true (the API ignores `unassigned=false`).
  const query = buildQueryString({
    q: params.q,
    status: params.status,
    priority: params.priority,
    assigneeId: params.assigneeId,
    unassigned: params.unassigned ? "true" : undefined,
    dueBefore: params.dueBefore,
    dueAfter: params.dueAfter,
    limit: params.limit,
    cursor: params.cursor,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  return request<TasksPage>(`/projects/${projectId}/tasks${query}`);
}

export async function createTask(projectId: string, input: CreateTaskInput): Promise<Task> {
  // `dueDate` is a Date after schema parsing; JSON.stringify serialises it to an
  // ISO string, which the API coerces back to a Date.
  const data = await request<{ task: Task }>(`/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return data.task;
}

export async function getTask(taskId: string): Promise<Task> {
  const data = await request<{ task: Task }>(`/tasks/${taskId}`);

  return data.task;
}

export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
  const data = await request<{ task: Task }>(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return data.task;
}

// Convenience wrapper for the Kanban board, which only ever changes status.
// Delegates to updateTask so the PATCH /tasks/:taskId behaviour stays in one place.
export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
  return updateTask(taskId, { status });
}

export async function deleteTask(taskId: string): Promise<void> {
  // The API soft-archives on DELETE and responds with { success: true }.
  await request<{ success: boolean }>(`/tasks/${taskId}`, {
    method: "DELETE",
  });
}

export async function getTaskComments(taskId: string): Promise<Comment[]> {
  // The API returns comments sorted by createdAt ascending (oldest first).
  const data = await request<{ comments: Comment[] }>(`/tasks/${taskId}/comments`);

  return data.comments;
}

export async function createTaskComment(
  taskId: string,
  input: CreateCommentInput,
): Promise<Comment> {
  const data = await request<{ comment: Comment }>(`/tasks/${taskId}/comments`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return data.comment;
}

export async function updateComment(
  commentId: string,
  input: UpdateCommentInput,
): Promise<Comment> {
  const data = await request<{ comment: Comment }>(`/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return data.comment;
}

export async function deleteComment(commentId: string): Promise<void> {
  // The API hard-deletes a comment and responds with { success: true }.
  await request<{ success: boolean }>(`/comments/${commentId}`, {
    method: "DELETE",
  });
}

export async function getTaskActivity(taskId: string): Promise<ActivityLog[]> {
  // The API returns activity newest-first and is paginated; the UI shows the
  // first page for now (mirroring the task list).
  const data = await request<{ activity: ActivityLog[]; nextCursor: string | null }>(
    `/tasks/${taskId}/activity`,
  );

  return data.activity;
}

export async function getProjectActivity(projectId: string): Promise<ActivityLog[]> {
  // Returns project-level activity plus its tasks' and comments' activity, all
  // newest-first. Paginated; the UI shows the first page for now.
  const data = await request<{ activity: ActivityLog[]; nextCursor: string | null }>(
    `/projects/${projectId}/activity`,
  );

  return data.activity;
}

export async function getNotifications(): Promise<Notification[]> {
  // The API returns the caller's notifications newest-first and is paginated; the
  // UI shows the first page for now (mirroring the activity and task lists).
  const data = await request<{ notifications: Notification[]; nextCursor: string | null }>(
    "/notifications",
  );

  return data.notifications;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const data = await request<{ count: number }>("/notifications/unread-count");

  return data.count;
}

export async function markNotificationRead(notificationId: string): Promise<Notification> {
  const data = await request<{ notification: Notification }>(
    `/notifications/${notificationId}/read`,
    {
      method: "PATCH",
    },
  );

  return data.notification;
}

export async function markAllNotificationsRead(): Promise<number> {
  // The API responds with { updated: <count> } — the number of rows changed.
  const data = await request<{ updated: number }>("/notifications/read-all", {
    method: "PATCH",
  });

  return data.updated;
}

export async function deleteNotification(notificationId: string): Promise<void> {
  // The API hard-deletes the notification and responds with { success: true }.
  await request<{ success: boolean }>(`/notifications/${notificationId}`, {
    method: "DELETE",
  });
}

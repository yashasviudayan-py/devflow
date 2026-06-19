import type {
  ActivityAction,
  ActivityEntityType,
  CreateCommentInput,
  CreateOrganizationInput,
  CreateProjectInput,
  CreateTaskInput,
  LoginInput,
  SignupInput,
  TaskFilterInput,
  TaskPriority,
  TaskStatus,
  UpdateCommentInput,
  UpdateProjectInput,
  UpdateTaskInput,
  UserRole,
} from "@devflow/shared";

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

export async function getOrganizationProjects(organizationId: string): Promise<Project[]> {
  const data = await request<{ projects: Project[] }>(
    `/organizations/${organizationId}/projects`,
  );

  return data.projects;
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

export async function getProjectTasks(
  projectId: string,
  filters: TaskFilterInput = {},
): Promise<Task[]> {
  // The API validates these filter values; we only forward the ones that are set.
  const params = new URLSearchParams();
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.priority) {
    params.set("priority", filters.priority);
  }
  if (filters.assigneeId) {
    params.set("assigneeId", filters.assigneeId);
  }

  const query = params.toString();
  // The list endpoint is paginated; the UI shows the first page for now.
  const data = await request<{ tasks: Task[]; nextCursor: string | null }>(
    `/projects/${projectId}/tasks${query ? `?${query}` : ""}`,
  );

  return data.tasks;
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

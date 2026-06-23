import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  createOrganization,
  createProject,
  createTaskComment,
  deleteComment,
  deleteNotification,
  deleteProject,
  getApiBaseUrl,
  getApiErrorMessage,
  getCurrentUser,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  getOrganization,
  getOrganizationMembers,
  getOrganizationProjects,
  getOrganizations,
  getProject,
  getProjectActivity,
  getProjectTasks,
  getTask,
  getTaskActivity,
  getTaskComments,
  createTask,
  deleteTask,
  login,
  logout,
  signup,
  updateComment,
  updateProject,
  updateTask,
  updateTaskStatus,
} from "./api";

const testUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  createdAt: "2026-06-08T00:00:00.000Z",
};

const testProject = {
  id: "project-1",
  organizationId: "org-1",
  createdById: "user-1",
  name: "Website redesign",
  description: "Refresh the public marketing site.",
  archivedAt: null,
  createdAt: "2026-06-08T00:00:00.000Z",
  updatedAt: "2026-06-08T00:00:00.000Z",
};

const testTask = {
  id: "task-1",
  projectId: "project-1",
  reporterId: "user-1",
  assigneeId: null,
  title: "Ship the tasks UI",
  description: "Build the frontend.",
  status: "TODO" as const,
  priority: "HIGH" as const,
  dueDate: null,
  archivedAt: null,
  createdAt: "2026-06-08T00:00:00.000Z",
  updatedAt: "2026-06-08T00:00:00.000Z",
  assignee: null,
  reporter: { id: "user-1", name: "Test User", email: "test@example.com" },
};

const testComment = {
  id: "comment-1",
  taskId: "task-1",
  authorId: "user-1",
  body: "Looks good to me",
  createdAt: "2026-06-18T00:00:00.000Z",
  updatedAt: "2026-06-18T00:00:00.000Z",
  author: { id: "user-1", name: "Test User", email: "test@example.com" },
};

const testOrganization = {
  id: "org-1",
  name: "Acme Inc",
  slug: "acme-inc",
  createdAt: "2026-06-08T00:00:00.000Z",
  updatedAt: "2026-06-08T00:00:00.000Z",
  role: "OWNER" as const,
};

function mockFetchResponse(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getApiBaseUrl", () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    }
  });

  it("defaults to the local API URL", () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    expect(getApiBaseUrl()).toBe("http://localhost:4000");
  });

  it("uses NEXT_PUBLIC_API_URL when set (e.g. the Render API URL in production)", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://devflow-api.onrender.com";

    expect(getApiBaseUrl()).toBe("https://devflow-api.onrender.com");
  });
});

describe("auth api client", () => {
  it("signs up with credentials included and returns the user", async () => {
    const fetchMock = mockFetchResponse(201, { user: testUser });

    const input = { name: "Test User", email: "test@example.com", password: "password123" };
    const user = await signup(input);

    expect(user).toEqual(testUser);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/auth/signup",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify(input),
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("logs in and returns the user", async () => {
    const fetchMock = mockFetchResponse(200, { user: testUser });

    const user = await login({ email: "test@example.com", password: "password123" });

    expect(user).toEqual(testUser);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/auth/login",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("fetches the current user with credentials included", async () => {
    const fetchMock = mockFetchResponse(200, { user: testUser });

    const user = await getCurrentUser();

    expect(user).toEqual(testUser);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/auth/me",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("logs out via POST with credentials included", async () => {
    const fetchMock = mockFetchResponse(200, { success: true });

    await logout();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/auth/logout",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("throws an ApiError with the backend error message", async () => {
    mockFetchResponse(401, { error: { message: "Invalid credentials", statusCode: 401 } });

    const error = await login({ email: "test@example.com", password: "wrong" }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe("Invalid credentials");
    expect((error as ApiError).statusCode).toBe(401);
  });

  it("throws a fallback ApiError when the error body is not JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("invalid json")),
    });
    vi.stubGlobal("fetch", fetchMock);

    const error = await getCurrentUser().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe("Something went wrong.");
    expect((error as ApiError).statusCode).toBe(500);
  });

  it("throws an ApiError when the API is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const error = await getCurrentUser().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).statusCode).toBe(0);
  });
});

describe("organization api client", () => {
  it("lists organizations with credentials included", async () => {
    const fetchMock = mockFetchResponse(200, { organizations: [testOrganization] });

    const organizations = await getOrganizations();

    expect(organizations).toEqual([testOrganization]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/organizations",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("creates an organization via POST and returns it", async () => {
    const fetchMock = mockFetchResponse(201, { organization: testOrganization });

    const input = { name: "Acme Inc" };
    const organization = await createOrganization(input);

    expect(organization).toEqual(testOrganization);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/organizations",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify(input),
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("fetches one organization including the user's role", async () => {
    const fetchMock = mockFetchResponse(200, { organization: testOrganization });

    const organization = await getOrganization("org-1");

    expect(organization.role).toBe("OWNER");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/organizations/org-1",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("fetches organization members", async () => {
    const testMember = {
      id: "member-1",
      role: "OWNER" as const,
      joinedAt: "2026-06-08T00:00:00.000Z",
      user: { id: "user-1", name: "Test User", email: "test@example.com" },
    };
    const fetchMock = mockFetchResponse(200, { members: [testMember] });

    const members = await getOrganizationMembers("org-1");

    expect(members).toEqual([testMember]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/organizations/org-1/members",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("surfaces the backend error for a duplicate slug", async () => {
    mockFetchResponse(409, { error: { message: "Slug is already in use.", statusCode: 409 } });

    const error = await createOrganization({ name: "Acme Inc", slug: "acme-inc" }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe("Slug is already in use.");
    expect((error as ApiError).statusCode).toBe(409);
  });
});

describe("project api client", () => {
  it("lists an organization's projects with credentials included", async () => {
    const fetchMock = mockFetchResponse(200, { projects: [testProject], nextCursor: null });

    const page = await getOrganizationProjects("org-1");

    expect(page.projects).toEqual([testProject]);
    expect(page.nextCursor).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/organizations/org-1/projects",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("forwards project search, sort, and pagination params", async () => {
    const fetchMock = mockFetchResponse(200, { projects: [], nextCursor: null });

    await getOrganizationProjects("org-1", {
      q: "api",
      sortBy: "name",
      sortOrder: "asc",
      limit: 10,
      cursor: "cursor-1",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/organizations/org-1/projects?q=api&limit=10&cursor=cursor-1&sortBy=name&sortOrder=asc",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("creates a project via POST and returns it", async () => {
    const fetchMock = mockFetchResponse(201, { project: testProject });

    const input = { name: "Website redesign", description: "Refresh the public marketing site." };
    const project = await createProject("org-1", input);

    expect(project).toEqual(testProject);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/organizations/org-1/projects",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify(input),
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("fetches a single project", async () => {
    const fetchMock = mockFetchResponse(200, { project: testProject });

    const project = await getProject("project-1");

    expect(project).toEqual(testProject);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/projects/project-1",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("updates a project via PATCH and returns it", async () => {
    const updated = { ...testProject, name: "New name" };
    const fetchMock = mockFetchResponse(200, { project: updated });

    const input = { name: "New name" };
    const project = await updateProject("project-1", input);

    expect(project).toEqual(updated);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/projects/project-1",
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify(input),
      }),
    );
  });

  it("archives a project via DELETE", async () => {
    const fetchMock = mockFetchResponse(200, { success: true });

    await deleteProject("project-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/projects/project-1",
      expect.objectContaining({ method: "DELETE", credentials: "include" }),
    );
  });

  it("surfaces a 403 when the caller lacks permission", async () => {
    mockFetchResponse(403, {
      error: { message: "You do not have permission to perform this action.", statusCode: 403 },
    });

    const error = await updateProject("project-1", { name: "Nope" }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).statusCode).toBe(403);
  });
});

describe("task api client", () => {
  it("lists a project's tasks with credentials included", async () => {
    const fetchMock = mockFetchResponse(200, { tasks: [testTask], nextCursor: null });

    const page = await getProjectTasks("project-1");

    expect(page.tasks).toEqual([testTask]);
    expect(page.nextCursor).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/projects/project-1/tasks",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("forwards only the filters that are set as query params", async () => {
    const fetchMock = mockFetchResponse(200, { tasks: [], nextCursor: null });

    await getProjectTasks("project-1", { status: "IN_PROGRESS", assigneeId: "user-2" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/projects/project-1/tasks?status=IN_PROGRESS&assigneeId=user-2",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("forwards search, due-date, unassigned, sort, and pagination params", async () => {
    const fetchMock = mockFetchResponse(200, { tasks: [], nextCursor: null });

    await getProjectTasks("project-1", {
      q: "bug",
      status: "IN_PROGRESS",
      priority: "HIGH",
      unassigned: true,
      dueAfter: "2026-01-01",
      dueBefore: "2026-12-31",
      sortBy: "dueDate",
      sortOrder: "desc",
      limit: 50,
      cursor: "cursor-2",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/projects/project-1/tasks?q=bug&status=IN_PROGRESS&priority=HIGH&unassigned=true&dueBefore=2026-12-31&dueAfter=2026-01-01&limit=50&cursor=cursor-2&sortBy=dueDate&sortOrder=desc",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("omits unassigned when false", async () => {
    const fetchMock = mockFetchResponse(200, { tasks: [], nextCursor: null });

    await getProjectTasks("project-1", { unassigned: false, assigneeId: "user-2" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/projects/project-1/tasks?assigneeId=user-2",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("creates a task via POST and returns it", async () => {
    const fetchMock = mockFetchResponse(201, { task: testTask });

    const input = { title: "Ship the tasks UI", priority: "HIGH" as const };
    const task = await createTask("project-1", input);

    expect(task).toEqual(testTask);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/projects/project-1/tasks",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify(input),
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("fetches a single task", async () => {
    const fetchMock = mockFetchResponse(200, { task: testTask });

    const task = await getTask("task-1");

    expect(task).toEqual(testTask);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/tasks/task-1",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("updates a task via PATCH and returns it", async () => {
    const updated = { ...testTask, status: "DONE" as const };
    const fetchMock = mockFetchResponse(200, { task: updated });

    const input = { status: "DONE" as const };
    const task = await updateTask("task-1", input);

    expect(task).toEqual(updated);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/tasks/task-1",
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify(input),
      }),
    );
  });

  it("updates only the status via updateTaskStatus", async () => {
    const updated = { ...testTask, status: "IN_PROGRESS" as const };
    const fetchMock = mockFetchResponse(200, { task: updated });

    const task = await updateTaskStatus("task-1", "IN_PROGRESS");

    expect(task).toEqual(updated);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/tasks/task-1",
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      }),
    );
  });

  it("surfaces a 403 when a viewer tries to move a task", async () => {
    mockFetchResponse(403, {
      error: { message: "You do not have permission to perform this action.", statusCode: 403 },
    });

    const error = await updateTaskStatus("task-1", "DONE").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).statusCode).toBe(403);
  });

  it("archives a task via DELETE", async () => {
    const fetchMock = mockFetchResponse(200, { success: true });

    await deleteTask("task-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/tasks/task-1",
      expect.objectContaining({ method: "DELETE", credentials: "include" }),
    );
  });

  it("surfaces a 404 for an inaccessible task", async () => {
    mockFetchResponse(404, { error: { message: "Task not found", statusCode: 404 } });

    const error = await getTask("task-x").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).statusCode).toBe(404);
  });
});

describe("comment api client", () => {
  it("lists a task's comments with credentials included", async () => {
    const fetchMock = mockFetchResponse(200, { comments: [testComment] });

    const comments = await getTaskComments("task-1");

    expect(comments).toEqual([testComment]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/tasks/task-1/comments",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("creates a comment via POST and returns it", async () => {
    const fetchMock = mockFetchResponse(201, { comment: testComment });

    const input = { body: "Looks good to me" };
    const comment = await createTaskComment("task-1", input);

    expect(comment).toEqual(testComment);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/tasks/task-1/comments",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify(input),
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("updates a comment via PATCH and returns it", async () => {
    const updated = { ...testComment, body: "Edited", updatedAt: "2026-06-18T01:00:00.000Z" };
    const fetchMock = mockFetchResponse(200, { comment: updated });

    const input = { body: "Edited" };
    const comment = await updateComment("comment-1", input);

    expect(comment).toEqual(updated);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/comments/comment-1",
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify(input),
      }),
    );
  });

  it("deletes a comment via DELETE", async () => {
    const fetchMock = mockFetchResponse(200, { success: true });

    await deleteComment("comment-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/comments/comment-1",
      expect.objectContaining({ method: "DELETE", credentials: "include" }),
    );
  });

  it("surfaces a 403 when a viewer tries to comment", async () => {
    mockFetchResponse(403, {
      error: { message: "You do not have permission to perform this action.", statusCode: 403 },
    });

    const error = await createTaskComment("task-1", { body: "Nope" }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).statusCode).toBe(403);
  });
});

describe("activity api client", () => {
  const testActivity = {
    id: "activity-1",
    organizationId: "org-1",
    projectId: "project-1",
    taskId: "task-1",
    actorId: "user-1",
    action: "TASK_STATUS_CHANGED" as const,
    entityType: "TASK" as const,
    entityId: "task-1",
    metadata: { from: "TODO", to: "IN_PROGRESS" },
    createdAt: "2026-06-19T00:00:00.000Z",
    actor: { id: "user-1", name: "Test User", email: "test@example.com" },
  };

  it("fetches task activity with credentials included", async () => {
    const fetchMock = mockFetchResponse(200, { activity: [testActivity], nextCursor: null });

    const activity = await getTaskActivity("task-1");

    expect(activity).toEqual([testActivity]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/tasks/task-1/activity",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("fetches project activity with credentials included", async () => {
    const fetchMock = mockFetchResponse(200, { activity: [testActivity], nextCursor: null });

    const activity = await getProjectActivity("project-1");

    expect(activity).toEqual([testActivity]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/projects/project-1/activity",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("surfaces a 404 for an inaccessible task's activity", async () => {
    mockFetchResponse(404, { error: { message: "Task not found", statusCode: 404 } });

    const error = await getTaskActivity("task-x").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).statusCode).toBe(404);
  });
});

describe("notification api client", () => {
  const testNotification = {
    id: "notification-1",
    userId: "user-1",
    actorId: "user-2",
    type: "TASK_ASSIGNED" as const,
    title: "Task assigned to you",
    message: 'Alex assigned you "Ship the tasks UI"',
    readAt: null,
    data: { taskId: "task-1", projectId: "project-1", organizationId: "org-1" },
    createdAt: "2026-06-20T00:00:00.000Z",
    updatedAt: "2026-06-20T00:00:00.000Z",
    actor: { id: "user-2", name: "Alex", email: "alex@example.com" },
  };

  it("lists notifications with credentials included", async () => {
    const fetchMock = mockFetchResponse(200, {
      notifications: [testNotification],
      nextCursor: null,
    });

    const notifications = await getNotifications();

    expect(notifications).toEqual([testNotification]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/notifications",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("fetches the unread count", async () => {
    const fetchMock = mockFetchResponse(200, { count: 3 });

    const count = await getUnreadNotificationCount();

    expect(count).toBe(3);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/notifications/unread-count",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("marks one notification read via PATCH and returns it", async () => {
    const updated = { ...testNotification, readAt: "2026-06-20T01:00:00.000Z" };
    const fetchMock = mockFetchResponse(200, { notification: updated });

    const notification = await markNotificationRead("notification-1");

    expect(notification).toEqual(updated);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/notifications/notification-1/read",
      expect.objectContaining({ method: "PATCH", credentials: "include" }),
    );
  });

  it("marks all notifications read via PATCH and returns the updated count", async () => {
    const fetchMock = mockFetchResponse(200, { updated: 5 });

    const updated = await markAllNotificationsRead();

    expect(updated).toBe(5);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/notifications/read-all",
      expect.objectContaining({ method: "PATCH", credentials: "include" }),
    );
  });

  it("deletes a notification via DELETE", async () => {
    const fetchMock = mockFetchResponse(200, { success: true });

    await deleteNotification("notification-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/notifications/notification-1",
      expect.objectContaining({ method: "DELETE", credentials: "include" }),
    );
  });

  it("surfaces a 404 when marking another user's notification read", async () => {
    mockFetchResponse(404, { error: { message: "Notification not found", statusCode: 404 } });

    const error = await markNotificationRead("notification-x").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).statusCode).toBe(404);
  });
});

describe("standard error shape parsing", () => {
  it("parses the code, details, and requestId from a validation error", async () => {
    mockFetchResponse(400, {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request body",
        statusCode: 400,
        details: [{ field: "email", message: "Email must be a valid email address." }],
        requestId: "req-123",
      },
    });

    const error = (await signup({
      name: "Y",
      email: "bad",
      password: "short",
    }).catch((caught: unknown) => caught)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.statusCode).toBe(400);
    expect(error.requestId).toBe("req-123");
    expect(error.details).toEqual([
      { field: "email", message: "Email must be a valid email address." },
    ]);
  });

  it("leaves code and details undefined for a non-JSON error body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("invalid json")),
    });
    vi.stubGlobal("fetch", fetchMock);

    const error = (await getCurrentUser().catch((caught: unknown) => caught)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("Something went wrong.");
    expect(error.code).toBeUndefined();
    expect(error.details).toBeUndefined();
  });

  it.each([
    [401, "UNAUTHORIZED"],
    [403, "FORBIDDEN"],
    [404, "NOT_FOUND"],
  ] as const)("parses the %i %s code cleanly", async (status, code) => {
    mockFetchResponse(status, { error: { code, message: "Nope", statusCode: status } });

    const error = (await getCurrentUser().catch((caught: unknown) => caught)) as ApiError;

    expect(error.statusCode).toBe(status);
    expect(error.code).toBe(code);
  });
});

describe("getApiErrorMessage", () => {
  it("joins validation detail messages into a friendly string", () => {
    const error = new ApiError("Invalid request body", 400, {
      code: "VALIDATION_ERROR",
      details: [
        { field: "name", message: "Name must be at least 2 characters." },
        { field: "email", message: "Email must be a valid email address." },
      ],
    });

    expect(getApiErrorMessage(error)).toBe(
      "Name must be at least 2 characters. Email must be a valid email address.",
    );
  });

  it("falls back to the API message for non-validation errors", () => {
    const error = new ApiError("Invalid credentials", 401, { code: "UNAUTHORIZED" });

    expect(getApiErrorMessage(error)).toBe("Invalid credentials");
  });

  it("returns a generic message for unknown throwables", () => {
    expect(getApiErrorMessage("a string")).toBe("Something went wrong.");
    expect(getApiErrorMessage(new Error(""))).toBe("Something went wrong.");
  });
});

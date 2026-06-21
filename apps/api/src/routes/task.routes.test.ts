import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  addMember,
  createOrganization,
  createProject,
  createTask,
  getApp,
  prisma,
  signupUser,
} from "../test/harness.js";

describe("task routes", () => {
  describe("POST /projects/:projectId/tasks", () => {
    it("lets an organization member create a task and records the reporter", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .post(`/projects/${project.id}/tasks`)
        .set("Cookie", owner.cookies)
        .send({ title: "Ship the API", priority: "HIGH" });

      expect(response.status).toBe(201);
      expect(response.body.task).toMatchObject({
        title: "Ship the API",
        priority: "HIGH",
        status: "TODO",
        projectId: project.id,
        reporterId: owner.id,
        archivedAt: null,
      });
    });

    it("lets a MEMBER create a task", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      await addMember(organization.id, member.id, "MEMBER");

      const response = await request(app)
        .post(`/projects/${project.id}/tasks`)
        .set("Cookie", member.cookies)
        .send({ title: "Member task" });

      expect(response.status).toBe(201);
      expect(response.body.task.reporterId).toBe(member.id);
    });

    it("can assign a task to a fellow organization member", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const assignee = await signupUser("Assignee Example", "assignee@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      await addMember(organization.id, assignee.id, "MEMBER");

      const response = await request(app)
        .post(`/projects/${project.id}/tasks`)
        .set("Cookie", owner.cookies)
        .send({ title: "Assigned task", assigneeId: assignee.id });

      expect(response.status).toBe(201);
      expect(response.body.task.assigneeId).toBe(assignee.id);
      expect(response.body.task.assignee).toEqual({
        id: assignee.id,
        name: "Assignee Example",
        email: "assignee@example.com",
      });
    });

    it("rejects assigning a task to a user outside the organization", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .post(`/projects/${project.id}/tasks`)
        .set("Cookie", owner.cookies)
        .send({ title: "Bad assignment", assigneeId: outsider.id });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("Assignee must be a member of the organization.");
    });

    it("rejects a VIEWER with 403", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const viewer = await signupUser("Viewer Example", "viewer@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      await addMember(organization.id, viewer.id, "VIEWER");

      const response = await request(app)
        .post(`/projects/${project.id}/tasks`)
        .set("Cookie", viewer.cookies)
        .send({ title: "Viewer task" });

      expect(response.status).toBe(403);
    });

    it("rejects an unauthenticated request", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .post(`/projects/${project.id}/tasks`)
        .send({ title: "Anon task" });

      expect(response.status).toBe(401);
    });

    it("rejects a non-member with 404", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .post(`/projects/${project.id}/tasks`)
        .set("Cookie", outsider.cookies)
        .send({ title: "Hijacked task" });

      expect(response.status).toBe(404);
    });

    it("rejects invalid input", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .post(`/projects/${project.id}/tasks`)
        .set("Cookie", owner.cookies)
        .send({ title: "   " });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("Invalid request body");
    });
  });

  describe("GET /projects/:projectId/tasks", () => {
    it("lets a member list project tasks and excludes archived ones", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const kept = await createTask(owner.cookies, project.id, { title: "Active task" });
      const archived = await createTask(owner.cookies, project.id, { title: "Archived task" });

      await request(app).delete(`/tasks/${archived.id}`).set("Cookie", owner.cookies).expect(200);

      const response = await request(app)
        .get(`/projects/${project.id}/tasks`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].id).toBe(kept.id);
      expect(response.body.nextCursor).toBeNull();
    });

    it("filters by status and priority", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      await createTask(owner.cookies, project.id, { title: "Todo low", priority: "LOW" });
      const target = await createTask(owner.cookies, project.id, {
        title: "In review urgent",
        status: "IN_REVIEW",
        priority: "URGENT",
      });

      const byStatus = await request(app)
        .get(`/projects/${project.id}/tasks?status=IN_REVIEW`)
        .set("Cookie", owner.cookies);

      expect(byStatus.status).toBe(200);
      expect(byStatus.body.tasks).toHaveLength(1);
      expect(byStatus.body.tasks[0].id).toBe(target.id);

      const byPriority = await request(app)
        .get(`/projects/${project.id}/tasks?priority=URGENT`)
        .set("Cookie", owner.cookies);

      expect(byPriority.body.tasks).toHaveLength(1);
      expect(byPriority.body.tasks[0].id).toBe(target.id);
    });

    it("paginates with limit and cursor", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const first = await createTask(owner.cookies, project.id, { title: "Task One" });
      const second = await createTask(owner.cookies, project.id, { title: "Task Two" });
      const third = await createTask(owner.cookies, project.id, { title: "Task Three" });

      const page1 = await request(app)
        .get(`/projects/${project.id}/tasks?limit=2`)
        .set("Cookie", owner.cookies);

      expect(page1.status).toBe(200);
      expect(page1.body.tasks.map((task: { id: string }) => task.id)).toEqual([
        first.id,
        second.id,
      ]);
      expect(page1.body.nextCursor).not.toBeNull();

      const page2 = await request(app)
        .get(`/projects/${project.id}/tasks?limit=2&cursor=${page1.body.nextCursor}`)
        .set("Cookie", owner.cookies);

      expect(page2.status).toBe(200);
      expect(page2.body.tasks.map((task: { id: string }) => task.id)).toEqual([third.id]);
      expect(page2.body.nextCursor).toBeNull();
    });

    it("searches task title and description with q", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const byTitle = await createTask(owner.cookies, project.id, { title: "Fix login bug" });
      const byDescription = await createTask(owner.cookies, project.id, {
        title: "Refactor auth",
        description: "Resolve the LOGIN edge case",
      });
      await createTask(owner.cookies, project.id, { title: "Update docs" });

      const response = await request(app)
        .get(`/projects/${project.id}/tasks?q=login`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      // Case-insensitive match across both title and description.
      expect(response.body.tasks.map((t: { id: string }) => t.id).sort()).toEqual(
        [byTitle.id, byDescription.id].sort(),
      );
    });

    it("filters by assignee and by unassigned", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const assignee = await signupUser("Assignee Example", "assignee@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      await addMember(organization.id, assignee.id, "MEMBER");

      const assigned = await createTask(owner.cookies, project.id, {
        title: "Assigned task",
        assigneeId: assignee.id,
      });
      const unassigned = await createTask(owner.cookies, project.id, { title: "Unassigned task" });

      const byAssignee = await request(app)
        .get(`/projects/${project.id}/tasks?assigneeId=${assignee.id}`)
        .set("Cookie", owner.cookies);
      expect(byAssignee.body.tasks).toHaveLength(1);
      expect(byAssignee.body.tasks[0].id).toBe(assigned.id);

      const byUnassigned = await request(app)
        .get(`/projects/${project.id}/tasks?unassigned=true`)
        .set("Cookie", owner.cookies);
      expect(byUnassigned.body.tasks).toHaveLength(1);
      expect(byUnassigned.body.tasks[0].id).toBe(unassigned.id);
    });

    it("filters by due date range with dueBefore and dueAfter", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      await createTask(owner.cookies, project.id, {
        title: "Early task",
        dueDate: "2026-01-10T00:00:00.000Z",
      });
      const middle = await createTask(owner.cookies, project.id, {
        title: "Middle task",
        dueDate: "2026-06-15T00:00:00.000Z",
      });
      await createTask(owner.cookies, project.id, {
        title: "Late task",
        dueDate: "2026-12-20T00:00:00.000Z",
      });

      const response = await request(app)
        .get(
          `/projects/${project.id}/tasks?dueAfter=2026-03-01T00:00:00.000Z&dueBefore=2026-09-01T00:00:00.000Z`,
        )
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].id).toBe(middle.id);
    });

    it("sorts tasks by title with sortOrder", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      await createTask(owner.cookies, project.id, { title: "Beta" });
      await createTask(owner.cookies, project.id, { title: "Gamma" });
      await createTask(owner.cookies, project.id, { title: "Alpha" });

      const response = await request(app)
        .get(`/projects/${project.id}/tasks?sortBy=title&sortOrder=asc`)
        .set("Cookie", owner.cookies);

      expect(response.body.tasks.map((t: { title: string }) => t.title)).toEqual([
        "Alpha",
        "Beta",
        "Gamma",
      ]);
    });

    it("does not leak passwordHash in nested user data", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const assignee = await signupUser("Assignee Example", "assignee@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      await addMember(organization.id, assignee.id, "MEMBER");

      await createTask(owner.cookies, project.id, {
        title: "Assigned task",
        assigneeId: assignee.id,
      });

      const response = await request(app)
        .get(`/projects/${project.id}/tasks`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(JSON.stringify(response.body)).not.toContain("passwordHash");
    });

    it("rejects an invalid sortBy with 400", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .get(`/projects/${project.id}/tasks?sortBy=assigneeId`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(400);
    });

    it("rejects a non-member with 404", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      await createTask(owner.cookies, project.id);

      const response = await request(app)
        .get(`/projects/${project.id}/tasks`)
        .set("Cookie", outsider.cookies);

      expect(response.status).toBe(404);
    });
  });

  describe("GET /tasks/:taskId", () => {
    it("lets a member view a task without leaking passwordHash", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await request(app).get(`/tasks/${task.id}`).set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(response.body.task.id).toBe(task.id);
      expect(response.body.task.reporter).toEqual({
        id: owner.id,
        name: "Owner Example",
        email: "owner@example.com",
      });
      expect(JSON.stringify(response.body)).not.toContain("passwordHash");
    });

    it("returns 404 for a non-member without leaking existence", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await request(app).get(`/tasks/${task.id}`).set("Cookie", outsider.cookies);

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe("Task not found");
    });

    it("rejects an unauthenticated request", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await request(app).get(`/tasks/${task.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /tasks/:taskId", () => {
    it("lets a member update status and priority", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await request(app)
        .patch(`/tasks/${task.id}`)
        .set("Cookie", owner.cookies)
        .send({ status: "IN_PROGRESS", priority: "URGENT" });

      expect(response.status).toBe(200);
      expect(response.body.task.status).toBe("IN_PROGRESS");
      expect(response.body.task.priority).toBe("URGENT");
    });

    it("can unassign a task with a null assignee", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const assignee = await signupUser("Assignee Example", "assignee@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      await addMember(organization.id, assignee.id, "MEMBER");

      const task = await createTask(owner.cookies, project.id, {
        title: "Assigned task",
        assigneeId: assignee.id,
      });

      const response = await request(app)
        .patch(`/tasks/${task.id}`)
        .set("Cookie", owner.cookies)
        .send({ assigneeId: null });

      expect(response.status).toBe(200);
      expect(response.body.task.assigneeId).toBeNull();
      expect(response.body.task.assignee).toBeNull();
    });

    it("rejects assigning a task to a user outside the organization", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await request(app)
        .patch(`/tasks/${task.id}`)
        .set("Cookie", owner.cookies)
        .send({ assigneeId: outsider.id });

      expect(response.status).toBe(400);
    });

    it("rejects an empty update", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await request(app)
        .patch(`/tasks/${task.id}`)
        .set("Cookie", owner.cookies)
        .send({});

      expect(response.status).toBe(400);
    });

    it("rejects a non-member with 404", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await request(app)
        .patch(`/tasks/${task.id}`)
        .set("Cookie", outsider.cookies)
        .send({ status: "DONE" });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /tasks/:taskId", () => {
    it("lets a member archive a task", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await request(app).delete(`/tasks/${task.id}`).set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      const stored = await prisma.task.findUnique({ where: { id: task.id } });
      expect(stored?.archivedAt).not.toBeNull();
    });

    it("rejects a VIEWER with 403", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const viewer = await signupUser("Viewer Example", "viewer@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      await addMember(organization.id, viewer.id, "VIEWER");

      const response = await request(app).delete(`/tasks/${task.id}`).set("Cookie", viewer.cookies);

      expect(response.status).toBe(403);
    });

    it("rejects a non-member with 404", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await request(app)
        .delete(`/tasks/${task.id}`)
        .set("Cookie", outsider.cookies);

      expect(response.status).toBe(404);
    });

    it("rejects an unauthenticated request", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await request(app).delete(`/tasks/${task.id}`);

      expect(response.status).toBe(401);
    });
  });
});

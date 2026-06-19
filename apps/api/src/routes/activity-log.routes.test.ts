import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  addMember,
  createOrganization,
  createProject,
  createTask,
  getApp,
  signupUser,
} from "../test/harness.js";

type ActivityEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  organizationId: string;
  projectId: string | null;
  taskId: string | null;
  actorId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
};

async function getTaskActivity(cookies: string[], taskId: string) {
  const app = await getApp();
  const response = await request(app).get(`/tasks/${taskId}/activity`).set("Cookie", cookies);
  return response;
}

async function getProjectActivity(cookies: string[], projectId: string) {
  const app = await getApp();
  const response = await request(app)
    .get(`/projects/${projectId}/activity`)
    .set("Cookie", cookies);
  return response;
}

function findAction(activity: ActivityEntry[], action: string) {
  return activity.find((entry) => entry.action === action);
}

describe("activity log routes", () => {
  describe("automatic activity recording", () => {
    it("records PROJECT_CREATED when a project is created", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await getProjectActivity(owner.cookies, project.id);

      expect(response.status).toBe(200);
      const created = findAction(response.body.activity, "PROJECT_CREATED");
      expect(created).toBeDefined();
      expect(created).toMatchObject({
        entityType: "PROJECT",
        entityId: project.id,
        projectId: project.id,
        organizationId: organization.id,
        actorId: owner.id,
      });
      expect(created?.metadata).toMatchObject({ name: project.name });
    });

    it("records TASK_CREATED when a task is created", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await getTaskActivity(owner.cookies, task.id);

      expect(response.status).toBe(200);
      const created = findAction(response.body.activity, "TASK_CREATED");
      expect(created).toMatchObject({
        entityType: "TASK",
        entityId: task.id,
        taskId: task.id,
        projectId: project.id,
        organizationId: organization.id,
        actorId: owner.id,
      });
    });

    it("records TASK_STATUS_CHANGED with old and new status", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      await request(app)
        .patch(`/tasks/${task.id}`)
        .set("Cookie", owner.cookies)
        .send({ status: "IN_PROGRESS" })
        .expect(200);

      const response = await getTaskActivity(owner.cookies, task.id);
      const changed = findAction(response.body.activity, "TASK_STATUS_CHANGED");
      expect(changed?.metadata).toEqual({ from: "TODO", to: "IN_PROGRESS" });
    });

    it("records TASK_PRIORITY_CHANGED with old and new priority", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      await request(app)
        .patch(`/tasks/${task.id}`)
        .set("Cookie", owner.cookies)
        .send({ priority: "HIGH" })
        .expect(200);

      const response = await getTaskActivity(owner.cookies, task.id);
      const changed = findAction(response.body.activity, "TASK_PRIORITY_CHANGED");
      expect(changed?.metadata).toEqual({ from: "MEDIUM", to: "HIGH" });
    });

    it("records TASK_ASSIGNED when a task is assigned to a member", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);
      await addMember(organization.id, member.id, "MEMBER");
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      await request(app)
        .patch(`/tasks/${task.id}`)
        .set("Cookie", owner.cookies)
        .send({ assigneeId: member.id })
        .expect(200);

      const response = await getTaskActivity(owner.cookies, task.id);
      const assigned = findAction(response.body.activity, "TASK_ASSIGNED");
      expect(assigned?.metadata).toMatchObject({ to: member.id });
    });

    it("records TASK_UNASSIGNED when a task is unassigned", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);
      await addMember(organization.id, member.id, "MEMBER");
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id, {
        title: "Assigned task",
        assigneeId: member.id,
      });

      await request(app)
        .patch(`/tasks/${task.id}`)
        .set("Cookie", owner.cookies)
        .send({ assigneeId: null })
        .expect(200);

      const response = await getTaskActivity(owner.cookies, task.id);
      const unassigned = findAction(response.body.activity, "TASK_UNASSIGNED");
      expect(unassigned?.metadata).toMatchObject({ from: member.id });
    });

    it("records COMMENT_CREATED in the task activity feed", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const commentResponse = await request(app)
        .post(`/tasks/${task.id}/comments`)
        .set("Cookie", owner.cookies)
        .send({ body: "First comment" })
        .expect(201);
      const commentId = commentResponse.body.comment.id as string;

      const response = await getTaskActivity(owner.cookies, task.id);
      const created = findAction(response.body.activity, "COMMENT_CREATED");
      expect(created).toMatchObject({
        entityType: "COMMENT",
        entityId: commentId,
        taskId: task.id,
        projectId: project.id,
      });
    });

    it("surfaces task activity in the project activity feed too", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await getProjectActivity(owner.cookies, project.id);
      const actions = response.body.activity.map((entry: ActivityEntry) => entry.action);
      expect(actions).toContain("PROJECT_CREATED");
      expect(actions).toContain("TASK_CREATED");
      expect(findAction(response.body.activity, "TASK_CREATED")?.entityId).toBe(task.id);
    });
  });

  describe("GET /tasks/:taskId/activity", () => {
    it("lets a member view task activity newest-first with safe actor data", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      await request(app)
        .patch(`/tasks/${task.id}`)
        .set("Cookie", owner.cookies)
        .send({ status: "IN_PROGRESS" })
        .expect(200);

      const response = await getTaskActivity(owner.cookies, task.id);

      expect(response.status).toBe(200);
      const actions = response.body.activity.map((entry: ActivityEntry) => entry.action);
      // Newest first: the status change happened after creation.
      expect(actions[0]).toBe("TASK_STATUS_CHANGED");
      expect(actions[actions.length - 1]).toBe("TASK_CREATED");

      // Actor is exposed with safe fields only — never passwordHash.
      expect(response.body.activity[0].actor).toEqual({
        id: owner.id,
        name: "Owner Example",
        email: "owner@example.com",
      });
      expect(JSON.stringify(response.body)).not.toContain("passwordHash");
    });

    it("lets a VIEWER read task activity", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const viewer = await signupUser("Viewer Example", "viewer@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);
      await addMember(organization.id, viewer.id, "VIEWER");

      const response = await getTaskActivity(viewer.cookies, task.id);

      expect(response.status).toBe(200);
      expect(response.body.activity.length).toBeGreaterThan(0);
    });

    it("rejects a non-member with 404 without leaking existence", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await getTaskActivity(outsider.cookies, task.id);

      expect(response.status).toBe(404);
    });

    it("rejects an unauthenticated request", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await request(app).get(`/tasks/${task.id}/activity`);

      expect(response.status).toBe(401);
    });

    it("rejects an invalid pagination limit with 400", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await request(app)
        .get(`/tasks/${task.id}/activity?limit=0`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(400);
    });
  });

  describe("GET /projects/:projectId/activity", () => {
    it("lets a member view project activity with safe actor data", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await getProjectActivity(owner.cookies, project.id);

      expect(response.status).toBe(200);
      expect(response.body.activity[0].actor).toEqual({
        id: owner.id,
        name: "Owner Example",
        email: "owner@example.com",
      });
      expect(JSON.stringify(response.body)).not.toContain("passwordHash");
    });

    it("rejects a non-member with 404 without leaking existence", async () => {
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await getProjectActivity(outsider.cookies, project.id);

      expect(response.status).toBe(404);
    });

    it("rejects an unauthenticated request", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app).get(`/projects/${project.id}/activity`);

      expect(response.status).toBe(401);
    });
  });
});

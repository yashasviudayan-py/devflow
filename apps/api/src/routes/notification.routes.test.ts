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

type Notification = {
  id: string;
  userId: string;
  actorId: string | null;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  actor: { id: string; name: string; email: string } | null;
};

async function patchTask(cookies: string[], taskId: string, body: Record<string, unknown>) {
  const app = await getApp();
  return request(app).patch(`/tasks/${taskId}`).set("Cookie", cookies).send(body);
}

async function addComment(cookies: string[], taskId: string, body = "A comment") {
  const app = await getApp();
  return request(app).post(`/tasks/${taskId}/comments`).set("Cookie", cookies).send({ body });
}

async function listNotifications(cookies: string[]) {
  const app = await getApp();
  return request(app).get("/notifications").set("Cookie", cookies);
}

function findType(notifications: Notification[], type: string) {
  return notifications.filter((n) => n.type === type);
}

// Spins up an org with an OWNER (actor) and a MEMBER (recipient) plus a project.
async function setupOrgWithMember() {
  const owner = await signupUser("Owner Example", "owner@example.com");
  const member = await signupUser("Member Example", "member@example.com");
  const organization = await createOrganization(owner.cookies);
  await addMember(organization.id, member.id, "MEMBER");
  const project = await createProject(owner.cookies, organization.id);
  return { owner, member, organization, project };
}

describe("notification routes", () => {
  describe("automatic notification creation", () => {
    it("notifies the assignee when a task is assigned to them on creation", async () => {
      const { owner, member, project } = await setupOrgWithMember();

      const task = await createTask(owner.cookies, project.id, {
        title: "Assigned task",
        assigneeId: member.id,
      });

      const response = await listNotifications(member.cookies);
      expect(response.status).toBe(200);

      const assigned = findType(response.body.notifications, "TASK_ASSIGNED");
      expect(assigned).toHaveLength(1);
      expect(assigned[0]).toMatchObject({
        userId: member.id,
        actorId: owner.id,
        title: "Task assigned to you",
      });
      expect(assigned[0].data).toMatchObject({ taskId: task.id, projectId: project.id });
      expect(assigned[0].actor).toEqual({
        id: owner.id,
        name: "Owner Example",
        email: "owner@example.com",
      });
    });

    it("notifies the new assignee when a task is reassigned", async () => {
      const { owner, member, project } = await setupOrgWithMember();
      const task = await createTask(owner.cookies, project.id);

      expect((await patchTask(owner.cookies, task.id, { assigneeId: member.id })).status).toBe(200);

      const response = await listNotifications(member.cookies);
      expect(findType(response.body.notifications, "TASK_ASSIGNED")).toHaveLength(1);
    });

    it("does not notify when a user assigns a task to themselves", async () => {
      const { owner, project } = await setupOrgWithMember();

      await createTask(owner.cookies, project.id, {
        title: "Self assigned",
        assigneeId: owner.id,
      });

      const response = await listNotifications(owner.cookies);
      expect(response.body.notifications).toHaveLength(0);
    });

    it("notifies the assignee when someone else changes the status", async () => {
      const { owner, member, project } = await setupOrgWithMember();
      const task = await createTask(owner.cookies, project.id, {
        title: "Status task",
        assigneeId: member.id,
      });

      expect((await patchTask(owner.cookies, task.id, { status: "IN_PROGRESS" })).status).toBe(200);

      const response = await listNotifications(member.cookies);
      const statusChanges = findType(response.body.notifications, "TASK_STATUS_CHANGED");
      expect(statusChanges).toHaveLength(1);
      expect(statusChanges[0].data).toMatchObject({ from: "TODO", to: "IN_PROGRESS" });
    });

    it("does not notify the assignee about their own status change", async () => {
      const { owner, member, project } = await setupOrgWithMember();
      const task = await createTask(owner.cookies, project.id, {
        title: "Self status",
        assigneeId: member.id,
      });

      // The assignee changes their own task's status — no self-notification.
      expect((await patchTask(member.cookies, task.id, { status: "IN_PROGRESS" })).status).toBe(200);

      const response = await listNotifications(member.cookies);
      expect(findType(response.body.notifications, "TASK_STATUS_CHANGED")).toHaveLength(0);
    });

    it("notifies the assignee when someone else changes the priority", async () => {
      const { owner, member, project } = await setupOrgWithMember();
      const task = await createTask(owner.cookies, project.id, {
        title: "Priority task",
        assigneeId: member.id,
      });

      expect((await patchTask(owner.cookies, task.id, { priority: "HIGH" })).status).toBe(200);

      const response = await listNotifications(member.cookies);
      const priorityChanges = findType(response.body.notifications, "TASK_PRIORITY_CHANGED");
      expect(priorityChanges).toHaveLength(1);
      expect(priorityChanges[0].data).toMatchObject({ from: "MEDIUM", to: "HIGH" });
    });

    it("notifies the assignee and reporter when someone else comments", async () => {
      const { owner, member, project } = await setupOrgWithMember();
      const commenter = await signupUser("Commenter Example", "commenter@example.com");
      // commenter must be an org member to post on the task.
      const orgId = project.organizationId;
      await addMember(orgId, commenter.id, "MEMBER");

      // owner is the reporter (creator); member is the assignee.
      const task = await createTask(owner.cookies, project.id, {
        title: "Discussed task",
        assigneeId: member.id,
      });

      expect((await addComment(commenter.cookies, task.id)).status).toBe(201);

      const assigneeResponse = await listNotifications(member.cookies);
      expect(findType(assigneeResponse.body.notifications, "COMMENT_ADDED")).toHaveLength(1);

      const reporterResponse = await listNotifications(owner.cookies);
      expect(findType(reporterResponse.body.notifications, "COMMENT_ADDED")).toHaveLength(1);

      // The comment author never receives a notification about their own comment.
      const authorResponse = await listNotifications(commenter.cookies);
      expect(findType(authorResponse.body.notifications, "COMMENT_ADDED")).toHaveLength(0);
    });

    it("does not notify the comment author when they are the assignee", async () => {
      const { owner, member, project } = await setupOrgWithMember();
      // member is both assignee and the commenter; owner is the reporter.
      const task = await createTask(owner.cookies, project.id, {
        title: "Self comment",
        assigneeId: member.id,
      });

      expect((await addComment(member.cookies, task.id)).status).toBe(201);

      const assigneeResponse = await listNotifications(member.cookies);
      expect(findType(assigneeResponse.body.notifications, "COMMENT_ADDED")).toHaveLength(0);

      // The reporter (owner) is still notified.
      const reporterResponse = await listNotifications(owner.cookies);
      expect(findType(reporterResponse.body.notifications, "COMMENT_ADDED")).toHaveLength(1);
    });

    it("sends a single comment notification when assignee and reporter are the same user", async () => {
      const { owner, member, project } = await setupOrgWithMember();
      // owner reports and assigns to themselves; member comments.
      const task = await createTask(owner.cookies, project.id, {
        title: "Owner owns it",
        assigneeId: owner.id,
      });

      expect((await addComment(member.cookies, task.id)).status).toBe(201);

      const response = await listNotifications(owner.cookies);
      // Deduplicated: owner is both assignee and reporter but gets one notification.
      expect(findType(response.body.notifications, "COMMENT_ADDED")).toHaveLength(1);
    });
  });

  describe("GET /notifications", () => {
    it("returns only the caller's notifications, newest first, with safe actor data", async () => {
      const { owner, member, project } = await setupOrgWithMember();
      const task = await createTask(owner.cookies, project.id, {
        title: "Task",
        assigneeId: member.id,
      });
      expect((await patchTask(owner.cookies, task.id, { priority: "HIGH" })).status).toBe(200);

      const response = await listNotifications(member.cookies);

      expect(response.status).toBe(200);
      const notifications = response.body.notifications as Notification[];
      expect(notifications.length).toBe(2);
      // Newest first: the priority change happened after the assignment.
      expect(notifications[0].type).toBe("TASK_PRIORITY_CHANGED");
      expect(notifications[notifications.length - 1].type).toBe("TASK_ASSIGNED");
      // Every notification belongs to the caller.
      expect(notifications.every((n) => n.userId === member.id)).toBe(true);
      // Actor exposes safe fields only — never passwordHash.
      expect(notifications[0].actor).toEqual({
        id: owner.id,
        name: "Owner Example",
        email: "owner@example.com",
      });
      expect(JSON.stringify(response.body)).not.toContain("passwordHash");
    });

    it("does not leak another user's notifications", async () => {
      const { owner, member, project } = await setupOrgWithMember();
      await createTask(owner.cookies, project.id, { title: "Task", assigneeId: member.id });

      // The actor (owner) has no notifications of their own from this action.
      const response = await listNotifications(owner.cookies);
      expect(response.status).toBe(200);
      expect(response.body.notifications).toHaveLength(0);
    });

    it("rejects an unauthenticated request", async () => {
      const app = await getApp();
      const response = await request(app).get("/notifications");
      expect(response.status).toBe(401);
    });

    it("rejects an invalid pagination limit with 400", async () => {
      const { member } = await setupOrgWithMember();
      const app = await getApp();
      const response = await request(app)
        .get("/notifications?limit=0")
        .set("Cookie", member.cookies);
      expect(response.status).toBe(400);
    });

    it("returns only unread notifications with unreadOnly=true", async () => {
      const { owner, member, project } = await setupOrgWithMember();
      const task = await createTask(owner.cookies, project.id, {
        title: "Task",
        assigneeId: member.id,
      });
      // A second notification so the member has two: assignment + priority change.
      expect((await patchTask(owner.cookies, task.id, { priority: "HIGH" })).status).toBe(200);

      const app = await getApp();
      // Mark the newest (priority change) read, leaving one unread.
      const all = await listNotifications(member.cookies);
      const newestId = all.body.notifications[0].id as string;
      await request(app)
        .patch(`/notifications/${newestId}/read`)
        .set("Cookie", member.cookies)
        .expect(200);

      const response = await request(app)
        .get("/notifications?unreadOnly=true")
        .set("Cookie", member.cookies);

      expect(response.status).toBe(200);
      const notifications = response.body.notifications as Notification[];
      expect(notifications).toHaveLength(1);
      expect(notifications.every((n) => n.readAt === null)).toBe(true);
      expect(notifications[0].id).not.toBe(newestId);
    });
  });

  describe("GET /notifications/unread-count", () => {
    it("counts only the caller's unread notifications", async () => {
      const { owner, member, project } = await setupOrgWithMember();
      const task = await createTask(owner.cookies, project.id, {
        title: "Task",
        assigneeId: member.id,
      });
      expect((await patchTask(owner.cookies, task.id, { status: "IN_PROGRESS" })).status).toBe(200);

      const app = await getApp();
      const response = await request(app)
        .get("/notifications/unread-count")
        .set("Cookie", member.cookies);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);

      // The actor has none.
      const ownerResponse = await request(app)
        .get("/notifications/unread-count")
        .set("Cookie", owner.cookies);
      expect(ownerResponse.body.count).toBe(0);
    });

    it("does not count read notifications", async () => {
      const { owner, member, project } = await setupOrgWithMember();
      await createTask(owner.cookies, project.id, { title: "Task", assigneeId: member.id });

      const list = await listNotifications(member.cookies);
      const notificationId = list.body.notifications[0].id as string;

      const app = await getApp();
      await request(app)
        .patch(`/notifications/${notificationId}/read`)
        .set("Cookie", member.cookies)
        .expect(200);

      const response = await request(app)
        .get("/notifications/unread-count")
        .set("Cookie", member.cookies);
      expect(response.body.count).toBe(0);
    });

    it("rejects an unauthenticated request", async () => {
      const app = await getApp();
      const response = await request(app).get("/notifications/unread-count");
      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /notifications/:notificationId/read", () => {
    it("marks the caller's own notification read", async () => {
      const { owner, member, project } = await setupOrgWithMember();
      await createTask(owner.cookies, project.id, { title: "Task", assigneeId: member.id });

      const list = await listNotifications(member.cookies);
      const notificationId = list.body.notifications[0].id as string;

      const app = await getApp();
      const response = await request(app)
        .patch(`/notifications/${notificationId}/read`)
        .set("Cookie", member.cookies);

      expect(response.status).toBe(200);
      expect(response.body.notification.id).toBe(notificationId);
      expect(response.body.notification.readAt).not.toBeNull();
    });

    it("returns 404 when marking another user's notification read", async () => {
      const { owner, member, project } = await setupOrgWithMember();
      await createTask(owner.cookies, project.id, { title: "Task", assigneeId: member.id });

      const list = await listNotifications(member.cookies);
      const notificationId = list.body.notifications[0].id as string;

      // owner tries to mark member's notification read — must not be allowed and
      // must not leak existence.
      const app = await getApp();
      const response = await request(app)
        .patch(`/notifications/${notificationId}/read`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(404);

      // The notification is still unread for the real owner.
      const count = await request(app)
        .get("/notifications/unread-count")
        .set("Cookie", member.cookies);
      expect(count.body.count).toBe(1);
    });

    it("rejects an unauthenticated request", async () => {
      const app = await getApp();
      const response = await request(app).patch("/notifications/whatever/read");
      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /notifications/read-all", () => {
    it("marks all of the caller's notifications read without affecting others", async () => {
      const { owner, member, project } = await setupOrgWithMember();
      // Two notifications for member, one for a second member.
      const other = await signupUser("Other Example", "other@example.com");
      const orgId = project.organizationId;
      await addMember(orgId, other.id, "MEMBER");

      const task = await createTask(owner.cookies, project.id, {
        title: "Task",
        assigneeId: member.id,
      });
      expect((await patchTask(owner.cookies, task.id, { status: "IN_PROGRESS" })).status).toBe(200);
      await createTask(owner.cookies, project.id, { title: "Other task", assigneeId: other.id });

      const app = await getApp();
      const response = await request(app)
        .patch("/notifications/read-all")
        .set("Cookie", member.cookies);

      expect(response.status).toBe(200);
      expect(response.body.updated).toBe(2);

      const memberCount = await request(app)
        .get("/notifications/unread-count")
        .set("Cookie", member.cookies);
      expect(memberCount.body.count).toBe(0);

      // The other user's notification is untouched.
      const otherCount = await request(app)
        .get("/notifications/unread-count")
        .set("Cookie", other.cookies);
      expect(otherCount.body.count).toBe(1);
    });

    it("rejects an unauthenticated request", async () => {
      const app = await getApp();
      const response = await request(app).patch("/notifications/read-all");
      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /notifications/:notificationId", () => {
    it("deletes the caller's own notification", async () => {
      const { owner, member, project } = await setupOrgWithMember();
      await createTask(owner.cookies, project.id, { title: "Task", assigneeId: member.id });

      const list = await listNotifications(member.cookies);
      const notificationId = list.body.notifications[0].id as string;

      const app = await getApp();
      const response = await request(app)
        .delete(`/notifications/${notificationId}`)
        .set("Cookie", member.cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const after = await listNotifications(member.cookies);
      expect(after.body.notifications).toHaveLength(0);
    });

    it("returns 404 when deleting another user's notification", async () => {
      const { owner, member, project } = await setupOrgWithMember();
      await createTask(owner.cookies, project.id, { title: "Task", assigneeId: member.id });

      const list = await listNotifications(member.cookies);
      const notificationId = list.body.notifications[0].id as string;

      const app = await getApp();
      const response = await request(app)
        .delete(`/notifications/${notificationId}`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(404);

      // The notification still exists for its real owner.
      const after = await listNotifications(member.cookies);
      expect(after.body.notifications).toHaveLength(1);
    });

    it("rejects an unauthenticated request", async () => {
      const app = await getApp();
      const response = await request(app).delete("/notifications/whatever");
      expect(response.status).toBe(401);
    });
  });
});

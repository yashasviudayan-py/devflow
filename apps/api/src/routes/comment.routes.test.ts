import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  addMember,
  createComment,
  createOrganization,
  createProject,
  createTask,
  getApp,
  prisma,
  signupUser,
} from "../test/harness.js";

describe("comment routes", () => {
  describe("POST /tasks/:taskId/comments", () => {
    it("lets an organization member comment and records the author", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await request(app)
        .post(`/tasks/${task.id}/comments`)
        .set("Cookie", owner.cookies)
        .send({ body: "Looks good to me" });

      expect(response.status).toBe(201);
      expect(response.body.comment).toMatchObject({
        body: "Looks good to me",
        taskId: task.id,
        authorId: owner.id,
      });
      expect(response.body.comment.author).toEqual({
        id: owner.id,
        name: "Owner Example",
        email: "owner@example.com",
      });
    });

    it("lets a MEMBER comment", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      await addMember(organization.id, member.id, "MEMBER");

      const response = await request(app)
        .post(`/tasks/${task.id}/comments`)
        .set("Cookie", member.cookies)
        .send({ body: "On it" });

      expect(response.status).toBe(201);
      expect(response.body.comment.authorId).toBe(member.id);
    });

    it("never returns passwordHash in the author data", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await request(app)
        .post(`/tasks/${task.id}/comments`)
        .set("Cookie", owner.cookies)
        .send({ body: "No secrets here" });

      expect(response.status).toBe(201);
      expect(JSON.stringify(response.body)).not.toContain("passwordHash");
    });

    it("rejects a VIEWER with 403", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const viewer = await signupUser("Viewer Example", "viewer@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      await addMember(organization.id, viewer.id, "VIEWER");

      const response = await request(app)
        .post(`/tasks/${task.id}/comments`)
        .set("Cookie", viewer.cookies)
        .send({ body: "Viewer comment" });

      expect(response.status).toBe(403);
    });

    it("rejects an unauthenticated request", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await request(app)
        .post(`/tasks/${task.id}/comments`)
        .send({ body: "Anon comment" });

      expect(response.status).toBe(401);
    });

    it("rejects a non-member with 404 without leaking existence", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await request(app)
        .post(`/tasks/${task.id}/comments`)
        .set("Cookie", outsider.cookies)
        .send({ body: "Hijacked comment" });

      expect(response.status).toBe(404);
    });

    it("rejects invalid input", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await request(app)
        .post(`/tasks/${task.id}/comments`)
        .set("Cookie", owner.cookies)
        .send({ body: "   " });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("Invalid request body");
    });
  });

  describe("GET /tasks/:taskId/comments", () => {
    it("lets a member list comments in createdAt ascending order with safe author data", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const first = await createComment(owner.cookies, task.id, { body: "First" });
      const second = await createComment(owner.cookies, task.id, { body: "Second" });

      const response = await request(app)
        .get(`/tasks/${task.id}/comments`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(response.body.comments.map((comment: { id: string }) => comment.id)).toEqual([
        first.id,
        second.id,
      ]);
      expect(response.body.comments[0].author).toEqual({
        id: owner.id,
        name: "Owner Example",
        email: "owner@example.com",
      });
      expect(JSON.stringify(response.body)).not.toContain("passwordHash");
    });

    it("lets a VIEWER read comments", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const viewer = await signupUser("Viewer Example", "viewer@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);
      await createComment(owner.cookies, task.id);

      await addMember(organization.id, viewer.id, "VIEWER");

      const response = await request(app)
        .get(`/tasks/${task.id}/comments`)
        .set("Cookie", viewer.cookies);

      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(1);
    });

    it("rejects a non-member with 404", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);
      await createComment(owner.cookies, task.id);

      const response = await request(app)
        .get(`/tasks/${task.id}/comments`)
        .set("Cookie", outsider.cookies);

      expect(response.status).toBe(404);
    });

    it("rejects an unauthenticated request", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      const response = await request(app).get(`/tasks/${task.id}/comments`);

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /comments/:commentId", () => {
    it("lets the author update their own comment", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);
      const comment = await createComment(owner.cookies, task.id, { body: "Original" });

      const response = await request(app)
        .patch(`/comments/${comment.id}`)
        .set("Cookie", owner.cookies)
        .send({ body: "Edited" });

      expect(response.status).toBe(200);
      expect(response.body.comment.body).toBe("Edited");
    });

    it("rejects a non-author member with 403", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);
      const comment = await createComment(owner.cookies, task.id);

      await addMember(organization.id, member.id, "MEMBER");

      const response = await request(app)
        .patch(`/comments/${comment.id}`)
        .set("Cookie", member.cookies)
        .send({ body: "Sneaky edit" });

      expect(response.status).toBe(403);
    });

    it("does not let an ADMIN edit another member's comment", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      await addMember(organization.id, member.id, "MEMBER");
      const comment = await createComment(member.cookies, task.id);

      // The owner is an ADMIN-equivalent (OWNER) but editing words is author-only.
      const response = await request(app)
        .patch(`/comments/${comment.id}`)
        .set("Cookie", owner.cookies)
        .send({ body: "Owner rewrite" });

      expect(response.status).toBe(403);
    });

    it("rejects a non-member with 404", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);
      const comment = await createComment(owner.cookies, task.id);

      const response = await request(app)
        .patch(`/comments/${comment.id}`)
        .set("Cookie", outsider.cookies)
        .send({ body: "Outsider edit" });

      expect(response.status).toBe(404);
    });

    it("rejects an unauthenticated request", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);
      const comment = await createComment(owner.cookies, task.id);

      const response = await request(app).patch(`/comments/${comment.id}`).send({ body: "Anon" });

      expect(response.status).toBe(401);
    });

    it("rejects invalid input", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);
      const comment = await createComment(owner.cookies, task.id);

      const response = await request(app)
        .patch(`/comments/${comment.id}`)
        .set("Cookie", owner.cookies)
        .send({ body: "" });

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /comments/:commentId", () => {
    it("lets the author delete their own comment", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);
      const comment = await createComment(owner.cookies, task.id);

      const response = await request(app)
        .delete(`/comments/${comment.id}`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      const stored = await prisma.comment.findUnique({ where: { id: comment.id } });
      expect(stored).toBeNull();
    });

    it("lets an OWNER delete another member's comment", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      await addMember(organization.id, member.id, "MEMBER");
      const comment = await createComment(member.cookies, task.id);

      const response = await request(app)
        .delete(`/comments/${comment.id}`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it("rejects a non-author MEMBER with 403", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);

      await addMember(organization.id, member.id, "MEMBER");
      const comment = await createComment(owner.cookies, task.id);

      const response = await request(app)
        .delete(`/comments/${comment.id}`)
        .set("Cookie", member.cookies);

      expect(response.status).toBe(403);
    });

    it("rejects a non-member with 404", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);
      const comment = await createComment(owner.cookies, task.id);

      const response = await request(app)
        .delete(`/comments/${comment.id}`)
        .set("Cookie", outsider.cookies);

      expect(response.status).toBe(404);
    });

    it("rejects an unauthenticated request", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);
      const task = await createTask(owner.cookies, project.id);
      const comment = await createComment(owner.cookies, task.id);

      const response = await request(app).delete(`/comments/${comment.id}`);

      expect(response.status).toBe(401);
    });
  });
});

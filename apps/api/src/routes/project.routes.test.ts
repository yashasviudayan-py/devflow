import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  addMember,
  createOrganization,
  createProject,
  getApp,
  prisma,
  signupUser,
} from "../test/harness.js";

describe("project routes", () => {
  describe("POST /organizations/:organizationId/projects", () => {
    it("lets an organization member create a project", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .post(`/organizations/${organization.id}/projects`)
        .set("Cookie", owner.cookies)
        .send({ name: "Website redesign", description: "Refresh the marketing site." });

      expect(response.status).toBe(201);
      expect(response.body.project).toMatchObject({
        name: "Website redesign",
        description: "Refresh the marketing site.",
        organizationId: organization.id,
        createdById: owner.id,
        archivedAt: null,
      });
    });

    it("lets a MEMBER create a project", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);

      await addMember(organization.id, member.id, "MEMBER");

      const response = await request(app)
        .post(`/organizations/${organization.id}/projects`)
        .set("Cookie", member.cookies)
        .send({ name: "Member project" });

      expect(response.status).toBe(201);
      expect(response.body.project.createdById).toBe(member.id);
    });

    it("rejects a VIEWER with 403", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const viewer = await signupUser("Viewer Example", "viewer@example.com");
      const organization = await createOrganization(owner.cookies);

      await addMember(organization.id, viewer.id, "VIEWER");

      const response = await request(app)
        .post(`/organizations/${organization.id}/projects`)
        .set("Cookie", viewer.cookies)
        .send({ name: "Viewer project" });

      expect(response.status).toBe(403);
    });

    it("rejects an unauthenticated request", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .post(`/organizations/${organization.id}/projects`)
        .send({ name: "Website redesign" });

      expect(response.status).toBe(401);
    });

    it("rejects a non-member with 404", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .post(`/organizations/${organization.id}/projects`)
        .set("Cookie", outsider.cookies)
        .send({ name: "Website redesign" });

      expect(response.status).toBe(404);
    });

    it("rejects invalid input", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .post(`/organizations/${organization.id}/projects`)
        .set("Cookie", owner.cookies)
        .send({ name: "A" });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("Invalid request body");
    });
  });

  describe("GET /organizations/:organizationId/projects", () => {
    it("lets a member list projects and excludes archived ones", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);

      const kept = await createProject(owner.cookies, organization.id, { name: "Active project" });
      const archived = await createProject(owner.cookies, organization.id, {
        name: "Archived project",
      });

      await request(app)
        .delete(`/projects/${archived.id}`)
        .set("Cookie", owner.cookies)
        .expect(200);

      const response = await request(app)
        .get(`/organizations/${organization.id}/projects`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(response.body.projects).toHaveLength(1);
      expect(response.body.projects[0].id).toBe(kept.id);
      expect(response.body.nextCursor).toBeNull();
    });

    it("paginates with limit and cursor", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);

      const first = await createProject(owner.cookies, organization.id, { name: "Project One" });
      const second = await createProject(owner.cookies, organization.id, { name: "Project Two" });
      const third = await createProject(owner.cookies, organization.id, { name: "Project Three" });

      const page1 = await request(app)
        .get(`/organizations/${organization.id}/projects?limit=2`)
        .set("Cookie", owner.cookies);

      expect(page1.status).toBe(200);
      expect(page1.body.projects.map((project: { id: string }) => project.id)).toEqual([
        first.id,
        second.id,
      ]);
      expect(page1.body.nextCursor).not.toBeNull();

      const page2 = await request(app)
        .get(`/organizations/${organization.id}/projects?limit=2&cursor=${page1.body.nextCursor}`)
        .set("Cookie", owner.cookies);

      expect(page2.status).toBe(200);
      expect(page2.body.projects.map((project: { id: string }) => project.id)).toEqual([third.id]);
      expect(page2.body.nextCursor).toBeNull();
    });

    it("rejects a non-member with 404", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .get(`/organizations/${organization.id}/projects`)
        .set("Cookie", outsider.cookies);

      expect(response.status).toBe(404);
    });

    it("only returns projects from the requested organization", async () => {
      const app = await getApp();
      const alice = await signupUser("Alice Example", "alice@example.com");
      const bob = await signupUser("Bob Example", "bob@example.com");

      const aliceOrg = await createOrganization(alice.cookies, { name: "Alice Org" });
      const bobOrg = await createOrganization(bob.cookies, { name: "Bob Org" });

      const aliceProject = await createProject(alice.cookies, aliceOrg.id, {
        name: "Alice project",
      });
      await createProject(bob.cookies, bobOrg.id, { name: "Bob project" });

      const response = await request(app)
        .get(`/organizations/${aliceOrg.id}/projects`)
        .set("Cookie", alice.cookies);

      expect(response.status).toBe(200);
      expect(response.body.projects).toHaveLength(1);
      expect(response.body.projects[0].id).toBe(aliceProject.id);
    });
  });

  describe("GET /projects/:projectId", () => {
    it("lets a member view a project", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .get(`/projects/${project.id}`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(response.body.project.id).toBe(project.id);
    });

    it("returns 404 for a non-member without leaking existence", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .get(`/projects/${project.id}`)
        .set("Cookie", outsider.cookies);

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe("Project not found");
    });

    it("rejects an unauthenticated request", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app).get(`/projects/${project.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /projects/:projectId", () => {
    it("lets an OWNER update a project", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .patch(`/projects/${project.id}`)
        .set("Cookie", owner.cookies)
        .send({ name: "Renamed project" });

      expect(response.status).toBe(200);
      expect(response.body.project.name).toBe("Renamed project");
    });

    it("lets an ADMIN update a project", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const admin = await signupUser("Admin Example", "admin@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      await addMember(organization.id, admin.id, "ADMIN");

      const response = await request(app)
        .patch(`/projects/${project.id}`)
        .set("Cookie", admin.cookies)
        .send({ description: "Updated by admin" });

      expect(response.status).toBe(200);
      expect(response.body.project.description).toBe("Updated by admin");
    });

    it("rejects a MEMBER with 403", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      await addMember(organization.id, member.id, "MEMBER");

      const response = await request(app)
        .patch(`/projects/${project.id}`)
        .set("Cookie", member.cookies)
        .send({ name: "Member rename" });

      expect(response.status).toBe(403);
    });

    it("rejects a non-member with 404", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .patch(`/projects/${project.id}`)
        .set("Cookie", outsider.cookies)
        .send({ name: "Hijacked" });

      expect(response.status).toBe(404);
    });

    it("rejects an empty update", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .patch(`/projects/${project.id}`)
        .set("Cookie", owner.cookies)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /projects/:projectId", () => {
    it("lets an OWNER archive a project", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .delete(`/projects/${project.id}`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      const stored = await prisma.project.findUnique({ where: { id: project.id } });
      expect(stored?.archivedAt).not.toBeNull();
    });

    it("lets an ADMIN archive a project", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const admin = await signupUser("Admin Example", "admin@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      await addMember(organization.id, admin.id, "ADMIN");

      const response = await request(app)
        .delete(`/projects/${project.id}`)
        .set("Cookie", admin.cookies);

      expect(response.status).toBe(200);
    });

    it("rejects a MEMBER with 403", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      await addMember(organization.id, member.id, "MEMBER");

      const response = await request(app)
        .delete(`/projects/${project.id}`)
        .set("Cookie", member.cookies);

      expect(response.status).toBe(403);
    });

    it("rejects a non-member with 404", async () => {
      const app = await getApp();
      const owner = await signupUser("Owner Example", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);
      const project = await createProject(owner.cookies, organization.id);

      const response = await request(app)
        .delete(`/projects/${project.id}`)
        .set("Cookie", outsider.cookies);

      expect(response.status).toBe(404);
    });
  });
});

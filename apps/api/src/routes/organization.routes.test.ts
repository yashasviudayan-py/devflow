import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  addMember,
  countMembers,
  createOrganization,
  findMembership,
  getApp,
  signupUser,
} from "../test/harness.js";

describe("organization routes", () => {
  describe("POST /organizations", () => {
    it("creates an organization and makes the creator OWNER", async () => {
      const app = await getApp();
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");

      const response = await request(app)
        .post("/organizations")
        .set("Cookie", owner.cookies)
        .send({ name: "Acme Inc" });

      expect(response.status).toBe(201);
      expect(response.body.organization).toMatchObject({
        name: "Acme Inc",
        slug: "acme-inc",
        role: "OWNER",
      });

      const membership = await findMembership(response.body.organization.id, owner.id);
      expect(membership?.role).toBe("OWNER");
    });

    it("uses a provided slug", async () => {
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");

      const organization = await createOrganization(owner.cookies, {
        name: "Acme Inc",
        slug: "custom-slug",
      });

      expect(organization.slug).toBe("custom-slug");
    });

    it("rejects a duplicate provided slug", async () => {
      const app = await getApp();
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      await createOrganization(owner.cookies, { name: "Acme Inc", slug: "acme" });

      const response = await request(app)
        .post("/organizations")
        .set("Cookie", owner.cookies)
        .send({ name: "Other Org", slug: "acme" });

      expect(response.status).toBe(409);
      expect(response.body.error.message).toBe("Slug is already in use.");
    });

    it("rejects an unauthenticated request", async () => {
      const app = await getApp();
      const response = await request(app).post("/organizations").send({ name: "Acme Inc" });

      expect(response.status).toBe(401);
    });

    it("rejects invalid input", async () => {
      const app = await getApp();
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");

      const response = await request(app)
        .post("/organizations")
        .set("Cookie", owner.cookies)
        .send({ name: "A" });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("Invalid request body");
    });
  });

  describe("GET /organizations", () => {
    it("returns only organizations the user belongs to", async () => {
      const app = await getApp();
      const alice = await signupUser("Alice Example", "alice@example.com");
      const bob = await signupUser("Bob Example", "bob@example.com");

      const aliceOrg = await createOrganization(alice.cookies, { name: "Alice Org" });
      await createOrganization(bob.cookies, { name: "Bob Org" });

      const response = await request(app).get("/organizations").set("Cookie", alice.cookies);

      expect(response.status).toBe(200);
      expect(response.body.organizations).toHaveLength(1);
      expect(response.body.organizations[0]).toMatchObject({
        id: aliceOrg.id,
        name: "Alice Org",
        role: "OWNER",
      });
      expect(response.body.nextCursor).toBeNull();
    });

    it("paginates with limit and cursor", async () => {
      const app = await getApp();
      const user = await signupUser("Paged Example", "paged@example.com");

      const first = await createOrganization(user.cookies, { name: "Org One" });
      const second = await createOrganization(user.cookies, { name: "Org Two" });
      const third = await createOrganization(user.cookies, { name: "Org Three" });

      const page1 = await request(app).get("/organizations?limit=2").set("Cookie", user.cookies);

      expect(page1.status).toBe(200);
      expect(page1.body.organizations.map((org: { id: string }) => org.id)).toEqual([
        first.id,
        second.id,
      ]);
      expect(page1.body.nextCursor).not.toBeNull();

      const page2 = await request(app)
        .get(`/organizations?limit=2&cursor=${page1.body.nextCursor}`)
        .set("Cookie", user.cookies);

      expect(page2.status).toBe(200);
      expect(page2.body.organizations.map((org: { id: string }) => org.id)).toEqual([third.id]);
      expect(page2.body.nextCursor).toBeNull();
    });
  });

  describe("GET /organizations/:organizationId", () => {
    it("returns the organization with the member's role", async () => {
      const app = await getApp();
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .get(`/organizations/${organization.id}`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(response.body.organization).toMatchObject({
        id: organization.id,
        name: "Acme Inc",
        role: "OWNER",
      });
    });

    it("returns 404 for a non-member", async () => {
      const app = await getApp();
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .get(`/organizations/${organization.id}`)
        .set("Cookie", outsider.cookies);

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe("Organization not found");
    });
  });

  describe("PATCH /organizations/:organizationId", () => {
    it("allows OWNER to update", async () => {
      const app = await getApp();
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .patch(`/organizations/${organization.id}`)
        .set("Cookie", owner.cookies)
        .send({ name: "Renamed Org" });

      expect(response.status).toBe(200);
      expect(response.body.organization.name).toBe("Renamed Org");
    });

    it("allows ADMIN to update", async () => {
      const app = await getApp();
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const admin = await signupUser("Admin Example", "admin@example.com");
      const organization = await createOrganization(owner.cookies);

      await addMember(organization.id, admin.id, "ADMIN");

      const response = await request(app)
        .patch(`/organizations/${organization.id}`)
        .set("Cookie", admin.cookies)
        .send({ name: "Admin Renamed" });

      expect(response.status).toBe(200);
      expect(response.body.organization.name).toBe("Admin Renamed");
    });

    it("rejects MEMBER with 403", async () => {
      const app = await getApp();
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);

      await addMember(organization.id, member.id, "MEMBER");

      const response = await request(app)
        .patch(`/organizations/${organization.id}`)
        .set("Cookie", member.cookies)
        .send({ name: "Member Renamed" });

      expect(response.status).toBe(403);
      expect(response.body.error.message).toBe(
        "You do not have permission to perform this action.",
      );
    });

    it("rejects a non-member with 404", async () => {
      const app = await getApp();
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .patch(`/organizations/${organization.id}`)
        .set("Cookie", outsider.cookies)
        .send({ name: "Hijacked" });

      expect(response.status).toBe(404);
    });

    it("rejects an empty body", async () => {
      const app = await getApp();
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .patch(`/organizations/${organization.id}`)
        .set("Cookie", owner.cookies)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe("GET /organizations/:organizationId/members", () => {
    it("returns members with safe user data only", async () => {
      const app = await getApp();
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);

      await addMember(organization.id, member.id, "MEMBER");

      const response = await request(app)
        .get(`/organizations/${organization.id}/members`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(response.body.members).toHaveLength(2);
      expect(response.body.members[0]).toMatchObject({
        role: "OWNER",
        user: {
          id: owner.id,
          name: "Yashasvi Udayan",
          email: "owner@example.com",
        },
      });
      expect(response.body.members[0].joinedAt).toBeDefined();
      expect(response.body.nextCursor).toBeNull();
      expect(JSON.stringify(response.body)).not.toContain("passwordHash");
    });

    it("returns 404 for a non-member", async () => {
      const app = await getApp();
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const outsider = await signupUser("Outsider Example", "outsider@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app)
        .get(`/organizations/${organization.id}/members`)
        .set("Cookie", outsider.cookies);

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /organizations/:organizationId/members/:memberId", () => {
    it("allows OWNER to remove a member", async () => {
      const app = await getApp();
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);

      const membership = await addMember(organization.id, member.id, "MEMBER");

      const response = await request(app)
        .delete(`/organizations/${organization.id}/members/${membership.id}`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
      expect(await countMembers(organization.id)).toBe(1);
    });

    it("rejects MEMBER with 403", async () => {
      const app = await getApp();
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const member = await signupUser("Member Example", "member@example.com");
      const organization = await createOrganization(owner.cookies);

      const membership = await addMember(organization.id, member.id, "MEMBER");

      const response = await request(app)
        .delete(`/organizations/${organization.id}/members/${membership.id}`)
        .set("Cookie", member.cookies);

      expect(response.status).toBe(403);
      expect(await countMembers(organization.id)).toBe(2);
    });

    it("rejects ADMIN with 403", async () => {
      const app = await getApp();
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const admin = await signupUser("Admin Example", "admin@example.com");
      const organization = await createOrganization(owner.cookies);

      const membership = await addMember(organization.id, admin.id, "ADMIN");

      const response = await request(app)
        .delete(`/organizations/${organization.id}/members/${membership.id}`)
        .set("Cookie", admin.cookies);

      expect(response.status).toBe(403);
    });

    it("rejects an unauthenticated request", async () => {
      const app = await getApp();
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const organization = await createOrganization(owner.cookies);

      const response = await request(app).delete(
        `/organizations/${organization.id}/members/member_1`,
      );

      expect(response.status).toBe(401);
    });

    it("prevents removing the only OWNER", async () => {
      const app = await getApp();
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const organization = await createOrganization(owner.cookies);
      const ownerMembership = await findMembership(organization.id, owner.id);

      const response = await request(app)
        .delete(`/organizations/${organization.id}/members/${ownerMembership?.id}`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe("Cannot remove the only owner of an organization.");
      expect(await countMembers(organization.id)).toBe(1);
    });

    it("returns 404 for a member of a different organization", async () => {
      const app = await getApp();
      const owner = await signupUser("Yashasvi Udayan", "owner@example.com");
      const other = await signupUser("Other Example", "other@example.com");
      const organization = await createOrganization(owner.cookies);
      const otherOrganization = await createOrganization(other.cookies, { name: "Other Org" });

      const otherMembership = await findMembership(otherOrganization.id, other.id);

      const response = await request(app)
        .delete(`/organizations/${organization.id}/members/${otherMembership?.id}`)
        .set("Cookie", owner.cookies);

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe("Member not found");
    });
  });
});

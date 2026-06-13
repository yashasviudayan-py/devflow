import { Router } from "express";
import {
  create,
  getOne,
  list,
  listMembers,
  removeMember,
  update,
} from "../controllers/organization.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  requireOrganizationMember,
  requireOrganizationRole,
} from "../middleware/organization.middleware.js";
import { organizationProjectRouter } from "./project.routes.js";

export const organizationRouter = Router();

organizationRouter.use(requireAuth);

organizationRouter.use("/:organizationId/projects", organizationProjectRouter);

organizationRouter.post("/", create);
organizationRouter.get("/", list);
organizationRouter.get("/:organizationId", requireOrganizationMember, getOne);
organizationRouter.patch("/:organizationId", requireOrganizationRole(["OWNER", "ADMIN"]), update);
organizationRouter.get("/:organizationId/members", requireOrganizationMember, listMembers);
organizationRouter.delete(
  "/:organizationId/members/:memberId",
  requireOrganizationRole(["OWNER"]),
  removeMember,
);

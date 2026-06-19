import { Router } from "express";
import { create, getOne, list, remove, update } from "../controllers/project.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  requireOrganizationMember,
  requireOrganizationRole,
} from "../middleware/organization.middleware.js";
import {
  requireProjectOrganizationMember,
  requireProjectOrganizationRole,
} from "../middleware/project.middleware.js";
import { projectActivityRouter } from "./activity-log.routes.js";
import { projectTaskRouter } from "./task.routes.js";

/**
 * Organization-scoped project routes. Mounted under
 * `/organizations/:organizationId/projects` by the organization router, which
 * already applies `requireAuth`. `mergeParams` exposes `:organizationId` so the
 * existing organization membership middleware works unchanged.
 *
 * Creating a project requires an active role (OWNER/ADMIN/MEMBER). VIEWER is a
 * read-only role, so viewers can list projects but cannot create them.
 */
export const organizationProjectRouter = Router({ mergeParams: true });

organizationProjectRouter.post("/", requireOrganizationRole(["OWNER", "ADMIN", "MEMBER"]), create);
organizationProjectRouter.get("/", requireOrganizationMember, list);

/**
 * Per-project routes mounted at `/projects`. Access is derived from the
 * organization that owns the project, so these never expose `:organizationId`.
 */
export const projectRouter = Router();

projectRouter.use(requireAuth);

// Task routes nested under a project. `requireAuth` above applies to them too.
projectRouter.use("/:projectId/tasks", projectTaskRouter);

// Activity feed nested under a project. `requireAuth` above applies to it too.
projectRouter.use("/:projectId/activity", projectActivityRouter);

projectRouter.get("/:projectId", requireProjectOrganizationMember, getOne);
projectRouter.patch("/:projectId", requireProjectOrganizationRole(["OWNER", "ADMIN"]), update);
projectRouter.delete("/:projectId", requireProjectOrganizationRole(["OWNER", "ADMIN"]), remove);

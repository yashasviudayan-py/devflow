import { Router } from "express";
import { create, getOne, list, remove, update } from "../controllers/task.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  requireProjectOrganizationMember,
  requireProjectOrganizationRole,
} from "../middleware/project.middleware.js";
import {
  requireTaskOrganizationMember,
  requireTaskOrganizationRole,
} from "../middleware/task.middleware.js";
import { taskActivityRouter } from "./activity-log.routes.js";
import { taskCommentRouter } from "./comment.routes.js";

/**
 * Project-scoped task routes. Mounted under `/projects/:projectId/tasks` by the
 * project router, which already applies `requireAuth`. `mergeParams` exposes
 * `:projectId` so the existing project membership middleware works unchanged.
 *
 * Creating a task requires an active role (OWNER/ADMIN/MEMBER). VIEWER is a
 * read-only role, so viewers can list tasks but cannot create them — mirroring
 * the project authorization model.
 */
export const projectTaskRouter = Router({ mergeParams: true });

projectTaskRouter.post("/", requireProjectOrganizationRole(["OWNER", "ADMIN", "MEMBER"]), create);
projectTaskRouter.get("/", requireProjectOrganizationMember, list);

/**
 * Per-task routes mounted at `/tasks`. Access is derived from the organization
 * that owns the task's project, so these never expose `:organizationId` or
 * `:projectId`.
 */
export const taskRouter = Router();

taskRouter.use(requireAuth);

// Comment routes nested under a task. `requireAuth` above applies to them too.
taskRouter.use("/:taskId/comments", taskCommentRouter);

// Activity feed nested under a task. `requireAuth` above applies to it too.
taskRouter.use("/:taskId/activity", taskActivityRouter);

taskRouter.get("/:taskId", requireTaskOrganizationMember, getOne);
taskRouter.patch("/:taskId", requireTaskOrganizationRole(["OWNER", "ADMIN", "MEMBER"]), update);
taskRouter.delete("/:taskId", requireTaskOrganizationRole(["OWNER", "ADMIN", "MEMBER"]), remove);

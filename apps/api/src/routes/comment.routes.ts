import { Router } from "express";
import { create, list, remove, update } from "../controllers/comment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireCommentOrganizationMember } from "../middleware/comment.middleware.js";
import {
  requireTaskOrganizationMember,
  requireTaskOrganizationRole,
} from "../middleware/task.middleware.js";

/**
 * Task-scoped comment routes. Mounted under `/tasks/:taskId/comments` by the task
 * router, which already applies `requireAuth`. `mergeParams` exposes `:taskId` so
 * the existing task authorization middleware works unchanged.
 *
 * Commenting is a write action, so it requires an active role (OWNER/ADMIN/MEMBER),
 * mirroring task creation. VIEWER is read-only: viewers can read comments but not
 * post them. Access is always derived from the organization that owns the task's
 * project, so users can never comment on tasks outside their organizations.
 */
export const taskCommentRouter = Router({ mergeParams: true });

taskCommentRouter.post(
  "/",
  requireTaskOrganizationRole(["OWNER", "ADMIN", "MEMBER"]),
  create,
);
taskCommentRouter.get("/", requireTaskOrganizationMember, list);

/**
 * Per-comment routes mounted at `/comments`. Access is derived from the
 * organization that owns the comment's task, so these never expose `:taskId`,
 * `:projectId`, or `:organizationId`.
 *
 * `requireCommentOrganizationMember` returns 404 when the comment does not exist
 * or the caller is not a member of its organization. Ownership (edit) and
 * moderation (delete) checks then live in the controller, where the loaded
 * comment author and caller role are available.
 */
export const commentRouter = Router();

commentRouter.use(requireAuth);

commentRouter.patch("/:commentId", requireCommentOrganizationMember, update);
commentRouter.delete("/:commentId", requireCommentOrganizationMember, remove);

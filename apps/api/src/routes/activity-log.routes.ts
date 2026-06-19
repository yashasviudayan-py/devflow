import { Router } from "express";
import {
  getProjectActivity,
  getTaskActivity,
} from "../controllers/activity-log.controller.js";
import { requireProjectOrganizationMember } from "../middleware/project.middleware.js";
import { requireTaskOrganizationMember } from "../middleware/task.middleware.js";

/**
 * Task-scoped activity feed. Mounted under `/tasks/:taskId/activity` by the task
 * router, which already applies `requireAuth`. `mergeParams` exposes `:taskId` so
 * the existing task authorization middleware works unchanged.
 *
 * Reading activity is a read action, so any organization member (including
 * VIEWER) may view it — access is derived entirely from membership in the
 * organization that owns the task's project. `requireTaskOrganizationMember`
 * returns 404 when the task does not exist or the caller is not a member, so the
 * endpoint never leaks activity from organizations the caller does not belong to.
 */
export const taskActivityRouter = Router({ mergeParams: true });

taskActivityRouter.get("/", requireTaskOrganizationMember, getTaskActivity);

/**
 * Project-scoped activity feed. Mounted under `/projects/:projectId/activity` by
 * the project router (which applies `requireAuth`). Mirrors the task feed: any
 * member of the owning organization may read it, and non-members get 404.
 */
export const projectActivityRouter = Router({ mergeParams: true });

projectActivityRouter.get("/", requireProjectOrganizationMember, getProjectActivity);

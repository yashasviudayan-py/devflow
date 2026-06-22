import { paginationQuerySchema } from "@devflow/shared";
import type { Request, Response } from "express";
import { HttpError } from "../middleware/error.middleware.js";
import { listProjectActivity, listTaskActivity } from "../services/activity-log.service.js";
import { asyncHandler } from "../utils/async-handler.js";

function getTask(req: Request) {
  if (!req.task) {
    throw new HttpError("Task not found", 404);
  }

  return req.task;
}

function getProject(req: Request) {
  if (!req.project) {
    throw new HttpError("Project not found", 404);
  }

  return req.project;
}

export const getTaskActivity = asyncHandler(async (req: Request, res: Response) => {
  // Membership/access has already been enforced by `requireTaskOrganizationMember`,
  // which also cached the resolved task on the request.
  const task = getTask(req);
  const pagination = paginationQuerySchema.parse(req.query);
  const { items, nextCursor } = await listTaskActivity(task.id, pagination);

  res.status(200).json({
    activity: items,
    nextCursor,
  });
});

export const getProjectActivity = asyncHandler(async (req: Request, res: Response) => {
  const project = getProject(req);
  const pagination = paginationQuerySchema.parse(req.query);
  const { items, nextCursor } = await listProjectActivity(project.id, pagination);

  res.status(200).json({
    activity: items,
    nextCursor,
  });
});

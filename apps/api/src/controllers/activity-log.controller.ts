import { paginationQuerySchema } from "@devflow/shared";
import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../middleware/error.middleware.js";
import {
  listProjectActivity,
  listTaskActivity,
} from "../services/activity-log.service.js";

function isValidationError(error: unknown) {
  return error instanceof Error && error.name === "ZodError";
}

function handleControllerError(error: unknown, next: NextFunction) {
  if (isValidationError(error)) {
    // Pagination query params are the only user-controlled input here.
    next(new HttpError("Invalid query parameters", 400));
    return;
  }

  next(error);
}

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

export async function getTaskActivity(req: Request, res: Response, next: NextFunction) {
  try {
    // Membership/access has already been enforced by `requireTaskOrganizationMember`,
    // which also cached the resolved task on the request.
    const task = getTask(req);
    const pagination = paginationQuerySchema.parse(req.query);
    const { items, nextCursor } = await listTaskActivity(task.id, pagination);

    res.status(200).json({
      activity: items,
      nextCursor,
    });
  } catch (error) {
    handleControllerError(error, next);
  }
}

export async function getProjectActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const project = getProject(req);
    const pagination = paginationQuerySchema.parse(req.query);
    const { items, nextCursor } = await listProjectActivity(project.id, pagination);

    res.status(200).json({
      activity: items,
      nextCursor,
    });
  } catch (error) {
    handleControllerError(error, next);
  }
}

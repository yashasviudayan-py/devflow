import {
  createTaskSchema,
  paginationQuerySchema,
  taskFilterSchema,
  updateTaskSchema,
} from "@devflow/shared";
import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../middleware/error.middleware.js";
import {
  archiveTask,
  assigneeBelongsToOrganization,
  createTask,
  listTasks,
  updateTask,
} from "../services/task.service.js";

function isValidationError(error: unknown) {
  return error instanceof Error && error.name === "ZodError";
}

function handleControllerError(error: unknown, next: NextFunction) {
  if (isValidationError(error)) {
    next(new HttpError("Invalid request body", 400));
    return;
  }

  next(error);
}

function getAuthenticatedUser(req: Request) {
  if (!req.user) {
    throw new HttpError("Not authenticated", 401);
  }

  return req.user;
}

function getMembership(req: Request) {
  if (!req.organizationMembership) {
    throw new HttpError("Organization not found", 404);
  }

  return req.organizationMembership;
}

function getProject(req: Request) {
  if (!req.project) {
    throw new HttpError("Project not found", 404);
  }

  return req.project;
}

function getTask(req: Request) {
  if (!req.task) {
    throw new HttpError("Task not found", 404);
  }

  return req.task;
}

async function ensureAssigneeBelongsToOrganization(organizationId: string, assigneeId: string) {
  const belongs = await assigneeBelongsToOrganization(organizationId, assigneeId);

  if (!belongs) {
    throw new HttpError("Assignee must be a member of the organization.", 400);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(req);
    const project = getProject(req);
    const membership = getMembership(req);
    const input = createTaskSchema.parse(req.body);

    if (input.assigneeId) {
      await ensureAssigneeBelongsToOrganization(membership.organizationId, input.assigneeId);
    }

    const task = await createTask(project.id, user.id, input);

    res.status(201).json({
      task,
    });
  } catch (error) {
    handleControllerError(error, next);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const project = getProject(req);
    const filters = taskFilterSchema.parse(req.query);
    const pagination = paginationQuerySchema.parse(req.query);
    const { items, nextCursor } = await listTasks(project.id, filters, pagination);

    res.status(200).json({
      tasks: items,
      nextCursor,
    });
  } catch (error) {
    handleControllerError(error, next);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const task = getTask(req);

    res.status(200).json({
      task,
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const task = getTask(req);
    const membership = getMembership(req);
    const input = updateTaskSchema.parse(req.body);

    // `null` unassigns the task; only a non-empty id needs membership validation.
    if (input.assigneeId) {
      await ensureAssigneeBelongsToOrganization(membership.organizationId, input.assigneeId);
    }

    const updated = await updateTask(task.id, input);

    res.status(200).json({
      task: updated,
    });
  } catch (error) {
    handleControllerError(error, next);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const task = getTask(req);
    // Soft-archive rather than hard-delete so the task (and its comments) is recoverable.
    await archiveTask(task.id);

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

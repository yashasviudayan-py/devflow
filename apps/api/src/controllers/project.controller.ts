import { createProjectSchema, paginationQuerySchema, updateProjectSchema } from "@devflow/shared";
import type { NextFunction, Request, Response } from "express";
import {
  recordProjectArchived,
  recordProjectCreated,
  recordProjectUpdated,
} from "../services/activity-log.service.js";
import { HttpError } from "../middleware/error.middleware.js";
import {
  archiveProject,
  createProject,
  listProjects,
  updateProject,
} from "../services/project.service.js";

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

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(req);
    const membership = getMembership(req);
    const input = createProjectSchema.parse(req.body);
    const project = await createProject(membership.organizationId, user.id, input);

    await recordProjectCreated({ organizationId: membership.organizationId, actorId: user.id }, project);

    res.status(201).json({
      project,
    });
  } catch (error) {
    handleControllerError(error, next);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const membership = getMembership(req);
    const pagination = paginationQuerySchema.parse(req.query);
    const { items, nextCursor } = await listProjects(membership.organizationId, pagination);

    res.status(200).json({
      projects: items,
      nextCursor,
    });
  } catch (error) {
    handleControllerError(error, next);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const project = getProject(req);

    res.status(200).json({
      project,
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(req);
    // `project` is the pre-update snapshot cached by the access middleware; the
    // recorder diffs it against the updated row to record what actually changed.
    const project = getProject(req);
    const input = updateProjectSchema.parse(req.body);
    const updated = await updateProject(project.id, input);

    await recordProjectUpdated(
      { organizationId: project.organizationId, actorId: user.id },
      project,
      updated,
    );

    res.status(200).json({
      project: updated,
    });
  } catch (error) {
    handleControllerError(error, next);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(req);
    const project = getProject(req);
    // Soft-archive rather than hard-delete so the data (and future tasks) is recoverable.
    await archiveProject(project.id);

    await recordProjectArchived(
      { organizationId: project.organizationId, actorId: user.id },
      project,
    );

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

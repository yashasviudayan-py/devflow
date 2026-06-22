import { createProjectSchema, listProjectsQuerySchema, updateProjectSchema } from "@devflow/shared";
import type { Request, Response } from "express";
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
import { asyncHandler } from "../utils/async-handler.js";

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

export const create = asyncHandler(async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const membership = getMembership(req);
  const input = createProjectSchema.parse(req.body);
  const project = await createProject(membership.organizationId, user.id, input);

  await recordProjectCreated(
    { organizationId: membership.organizationId, actorId: user.id },
    project,
  );

  res.status(201).json({
    project,
  });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const membership = getMembership(req);
  const query = listProjectsQuerySchema.parse(req.query);
  const { items, nextCursor } = await listProjects(membership.organizationId, query);

  res.status(200).json({
    projects: items,
    nextCursor,
  });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const project = getProject(req);

  res.status(200).json({
    project,
  });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
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
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
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
});

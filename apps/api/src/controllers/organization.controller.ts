import {
  createOrganizationSchema,
  paginationQuerySchema,
  updateOrganizationSchema,
} from "@devflow/shared";
import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../middleware/error.middleware.js";
import {
  createOrganization,
  getOrganizationById,
  listOrganizationMembers,
  listOrganizationsForUser,
  removeOrganizationMember,
  updateOrganization,
} from "../services/organization.service.js";

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

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(req);
    const input = createOrganizationSchema.parse(req.body);
    const organization = await createOrganization(user.id, input);

    res.status(201).json({
      organization,
    });
  } catch (error) {
    handleControllerError(error, next);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(req);
    const pagination = paginationQuerySchema.parse(req.query);
    const { items, nextCursor } = await listOrganizationsForUser(user.id, pagination);

    res.status(200).json({
      organizations: items,
      nextCursor,
    });
  } catch (error) {
    handleControllerError(error, next);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const membership = getMembership(req);
    const organization = await getOrganizationById(membership.organizationId);

    res.status(200).json({
      organization: {
        ...organization,
        role: membership.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const membership = getMembership(req);
    const input = updateOrganizationSchema.parse(req.body);
    const organization = await updateOrganization(membership.organizationId, input);

    res.status(200).json({
      organization,
    });
  } catch (error) {
    handleControllerError(error, next);
  }
}

export async function listMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const membership = getMembership(req);
    const pagination = paginationQuerySchema.parse(req.query);
    const { items, nextCursor } = await listOrganizationMembers(
      membership.organizationId,
      pagination,
    );

    res.status(200).json({
      members: items,
      nextCursor,
    });
  } catch (error) {
    handleControllerError(error, next);
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    const membership = getMembership(req);
    await removeOrganizationMember(membership.organizationId, req.params.memberId);

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

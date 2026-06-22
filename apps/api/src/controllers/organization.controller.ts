import {
  createOrganizationSchema,
  paginationQuerySchema,
  updateOrganizationSchema,
} from "@devflow/shared";
import type { Request, Response } from "express";
import { HttpError } from "../middleware/error.middleware.js";
import {
  createOrganization,
  getOrganizationById,
  listOrganizationMembers,
  listOrganizationsForUser,
  removeOrganizationMember,
  updateOrganization,
} from "../services/organization.service.js";
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

export const create = asyncHandler(async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const input = createOrganizationSchema.parse(req.body);
  const organization = await createOrganization(user.id, input);

  res.status(201).json({
    organization,
  });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const pagination = paginationQuerySchema.parse(req.query);
  const { items, nextCursor } = await listOrganizationsForUser(user.id, pagination);

  res.status(200).json({
    organizations: items,
    nextCursor,
  });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const membership = getMembership(req);
  const organization = await getOrganizationById(membership.organizationId);

  res.status(200).json({
    organization: {
      ...organization,
      role: membership.role,
    },
  });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const membership = getMembership(req);
  const input = updateOrganizationSchema.parse(req.body);
  const organization = await updateOrganization(membership.organizationId, input);

  res.status(200).json({
    organization,
  });
});

export const listMembers = asyncHandler(async (req: Request, res: Response) => {
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
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const membership = getMembership(req);
  await removeOrganizationMember(membership.organizationId, req.params.memberId);

  res.status(200).json({
    success: true,
  });
});

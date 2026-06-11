import type { UserRole } from "@devflow/shared";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "./error.middleware.js";

export type OrganizationMembership = {
  id: string;
  organizationId: string;
  userId: string;
  role: UserRole;
};

async function loadMembership(req: Request): Promise<OrganizationMembership | null> {
  if (req.organizationMembership) {
    return req.organizationMembership;
  }

  const organizationId = req.params.organizationId;
  const userId = req.user?.id;

  if (!organizationId || !userId) {
    return null;
  }

  return prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    select: {
      id: true,
      organizationId: true,
      userId: true,
      role: true,
    },
  });
}

export async function requireOrganizationMember(req: Request, _res: Response, next: NextFunction) {
  try {
    const membership = await loadMembership(req);

    if (!membership) {
      // 404 instead of 403 so non-members cannot probe which organizations exist.
      next(new HttpError("Organization not found", 404));
      return;
    }

    req.organizationMembership = membership;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireOrganizationRole(roles: UserRole[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const membership = await loadMembership(req);

      if (!membership) {
        next(new HttpError("Organization not found", 404));
        return;
      }

      if (!roles.includes(membership.role)) {
        next(new HttpError("You do not have permission to perform this action.", 403));
        return;
      }

      req.organizationMembership = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
}

import type { UserRole } from "@devflow/shared";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { getProjectById, type ProjectRecord } from "../services/project.service.js";
import { HttpError } from "./error.middleware.js";

type ProjectAccess = {
  project: ProjectRecord;
  role: UserRole;
};

/**
 * Resolves the project for `:projectId` and the current user's membership in the
 * organization that owns it. Returns `null` when the project does not exist OR the
 * user is not a member of its organization — both map to a 404 so we never leak the
 * existence of projects the caller cannot access.
 *
 * On success the loaded project and membership are cached on the request so
 * controllers can reuse them without re-querying.
 */
async function loadProjectAccess(req: Request): Promise<ProjectAccess | null> {
  const projectId = req.params.projectId;
  const userId = req.user?.id;

  if (!projectId || !userId) {
    return null;
  }

  if (req.project?.id === projectId && req.organizationMembership) {
    return { project: req.project, role: req.organizationMembership.role };
  }

  const project = await getProjectById(projectId);

  if (!project) {
    return null;
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: project.organizationId,
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

  if (!membership) {
    return null;
  }

  req.project = project;
  req.organizationMembership = membership;

  return { project, role: membership.role };
}

export async function requireProjectOrganizationMember(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const access = await loadProjectAccess(req);

    if (!access) {
      next(new HttpError("Project not found", 404));
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function requireProjectOrganizationRole(roles: UserRole[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const access = await loadProjectAccess(req);

      if (!access) {
        next(new HttpError("Project not found", 404));
        return;
      }

      if (!roles.includes(access.role)) {
        next(new HttpError("You do not have permission to perform this action.", 403));
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

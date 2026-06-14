import type { UserRole } from "@devflow/shared";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { getTaskWithOrganization, type TaskRecord } from "../services/task.service.js";
import { HttpError } from "./error.middleware.js";

type TaskAccess = {
  task: TaskRecord;
  role: UserRole;
};

/**
 * Resolves the task for `:taskId` and the current user's membership in the
 * organization that owns the task's project (task -> project -> organization).
 * Returns `null` when the task does not exist OR the user is not a member of its
 * organization — both map to a 404 so we never leak the existence of tasks the
 * caller cannot access.
 *
 * On success the loaded task and membership are cached on the request so
 * controllers can reuse them without re-querying.
 */
async function loadTaskAccess(req: Request): Promise<TaskAccess | null> {
  const taskId = req.params.taskId;
  const userId = req.user?.id;

  if (!taskId || !userId) {
    return null;
  }

  if (req.task?.id === taskId && req.organizationMembership) {
    return { task: req.task, role: req.organizationMembership.role };
  }

  const loaded = await getTaskWithOrganization(taskId);

  if (!loaded) {
    return null;
  }

  const { project, ...task } = loaded;

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

  req.task = task;
  req.organizationMembership = membership;

  return { task, role: membership.role };
}

export async function requireTaskOrganizationMember(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const access = await loadTaskAccess(req);

    if (!access) {
      next(new HttpError("Task not found", 404));
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function requireTaskOrganizationRole(roles: UserRole[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const access = await loadTaskAccess(req);

      if (!access) {
        next(new HttpError("Task not found", 404));
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

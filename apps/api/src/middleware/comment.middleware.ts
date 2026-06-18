import type { UserRole } from "@devflow/shared";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { getCommentWithOrganization, type CommentRecord } from "../services/comment.service.js";
import { HttpError } from "./error.middleware.js";

type CommentAccess = {
  comment: CommentRecord;
  role: UserRole;
};

/**
 * Resolves the comment for `:commentId` and the current user's membership in the
 * organization that owns the comment's task (comment -> task -> project ->
 * organization). Returns `null` when the comment does not exist OR the user is not
 * a member of its organization — both map to a 404 so we never leak the existence
 * of comments the caller cannot access.
 *
 * On success the loaded comment and membership are cached on the request so
 * controllers can reuse them (e.g. for ownership/role checks) without re-querying.
 */
async function loadCommentAccess(req: Request): Promise<CommentAccess | null> {
  const commentId = req.params.commentId;
  const userId = req.user?.id;

  if (!commentId || !userId) {
    return null;
  }

  const loaded = await getCommentWithOrganization(commentId);

  if (!loaded) {
    return null;
  }

  const { task, ...comment } = loaded;

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: task.project.organizationId,
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

  req.comment = comment;
  req.organizationMembership = membership;

  return { comment, role: membership.role };
}

export async function requireCommentOrganizationMember(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const access = await loadCommentAccess(req);

    if (!access) {
      next(new HttpError("Comment not found", 404));
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}

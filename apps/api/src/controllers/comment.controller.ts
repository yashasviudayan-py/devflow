import { createCommentSchema, updateCommentSchema, type UserRole } from "@devflow/shared";
import type { NextFunction, Request, Response } from "express";
import {
  recordCommentCreated,
  recordCommentDeleted,
  recordCommentUpdated,
} from "../services/activity-log.service.js";
import { HttpError } from "../middleware/error.middleware.js";
import { notifyTaskCommented } from "../services/notification.service.js";
import {
  createComment,
  deleteComment,
  listComments,
  updateComment,
} from "../services/comment.service.js";

// Roles allowed to moderate (delete) comments they do not own.
const COMMENT_MODERATOR_ROLES: UserRole[] = ["OWNER", "ADMIN"];

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

function getTask(req: Request) {
  if (!req.task) {
    throw new HttpError("Task not found", 404);
  }

  return req.task;
}

function getComment(req: Request) {
  if (!req.comment) {
    throw new HttpError("Comment not found", 404);
  }

  return req.comment;
}

function getMembership(req: Request) {
  if (!req.organizationMembership) {
    throw new HttpError("Comment not found", 404);
  }

  return req.organizationMembership;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(req);
    const task = getTask(req);
    const membership = getMembership(req);
    const input = createCommentSchema.parse(req.body);

    const comment = await createComment(task.id, user.id, input);

    await recordCommentCreated({ taskId: task.id, commentId: comment.id, actorId: user.id });

    // Notify the task's assignee and reporter (creator), excluding the comment
    // author. `task` here is the access-middleware snapshot, which carries both ids.
    await notifyTaskCommented(
      { organizationId: membership.organizationId, actor: user },
      task,
      comment.id,
    );

    res.status(201).json({
      comment,
    });
  } catch (error) {
    handleControllerError(error, next);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const task = getTask(req);
    const comments = await listComments(task.id);

    res.status(200).json({
      comments,
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(req);
    const comment = getComment(req);

    // Only the author may edit their own comment. OWNER/ADMIN cannot edit others'
    // comments — editing someone else's words is different from moderating them.
    if (comment.authorId !== user.id) {
      throw new HttpError("You do not have permission to perform this action.", 403);
    }

    const input = updateCommentSchema.parse(req.body);
    const updated = await updateComment(comment.id, input);

    await recordCommentUpdated({
      taskId: comment.taskId,
      commentId: comment.id,
      actorId: user.id,
    });

    res.status(200).json({
      comment: updated,
    });
  } catch (error) {
    handleControllerError(error, next);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(req);
    const comment = getComment(req);
    const membership = getMembership(req);

    // Authors may delete their own comments; OWNER/ADMIN may moderate any comment.
    const isAuthor = comment.authorId === user.id;
    const isModerator = COMMENT_MODERATOR_ROLES.includes(membership.role);

    if (!isAuthor && !isModerator) {
      throw new HttpError("You do not have permission to perform this action.", 403);
    }

    await deleteComment(comment.id);

    // Recorded after the hard delete. The log references the comment id as a plain
    // string (not a foreign key), so the COMMENT_DELETED entry survives even though
    // the comment row is gone; the task it belonged to still exists for context.
    await recordCommentDeleted({
      taskId: comment.taskId,
      commentId: comment.id,
      actorId: user.id,
    });

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

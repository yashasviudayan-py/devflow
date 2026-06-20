import { paginationQuerySchema } from "@devflow/shared";
import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../middleware/error.middleware.js";
import {
  deleteNotification,
  getUnreadNotificationCount,
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification.service.js";

function isValidationError(error: unknown) {
  return error instanceof Error && error.name === "ZodError";
}

function handleControllerError(error: unknown, next: NextFunction) {
  if (isValidationError(error)) {
    // Pagination query params are the only user-controlled input here.
    next(new HttpError("Invalid query parameters", 400));
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

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(req);
    const pagination = paginationQuerySchema.parse(req.query);
    const { items, nextCursor } = await getUserNotifications(user.id, pagination);

    res.status(200).json({
      notifications: items,
      nextCursor,
    });
  } catch (error) {
    handleControllerError(error, next);
  }
}

export async function unreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(req);
    const count = await getUnreadNotificationCount(user.id);

    res.status(200).json({
      count,
    });
  } catch (error) {
    next(error);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(req);
    // Scoped to the owner in the service: a missing id and another user's id both
    // return null, so we respond 404 without leaking the notification's existence.
    const notification = await markNotificationRead(req.params.notificationId, user.id);

    if (!notification) {
      throw new HttpError("Notification not found", 404);
    }

    res.status(200).json({
      notification,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(req);
    const updated = await markAllNotificationsRead(user.id);

    res.status(200).json({
      updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthenticatedUser(req);
    const deleted = await deleteNotification(req.params.notificationId, user.id);

    if (!deleted) {
      throw new HttpError("Notification not found", 404);
    }

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

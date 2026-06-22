import { listNotificationsQuerySchema } from "@devflow/shared";
import type { Request, Response } from "express";
import { HttpError } from "../middleware/error.middleware.js";
import {
  deleteNotification,
  getUnreadNotificationCount,
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification.service.js";
import { asyncHandler } from "../utils/async-handler.js";

function getAuthenticatedUser(req: Request) {
  if (!req.user) {
    throw new HttpError("Not authenticated", 401);
  }

  return req.user;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const query = listNotificationsQuerySchema.parse(req.query);
  const { items, nextCursor } = await getUserNotifications(user.id, query);

  res.status(200).json({
    notifications: items,
    nextCursor,
  });
});

export const unreadCount = asyncHandler(async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const count = await getUnreadNotificationCount(user.id);

  res.status(200).json({
    count,
  });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
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
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const updated = await markAllNotificationsRead(user.id);

  res.status(200).json({
    updated,
  });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const deleted = await deleteNotification(req.params.notificationId, user.id);

  if (!deleted) {
    throw new HttpError("Notification not found", 404);
  }

  res.status(200).json({
    success: true,
  });
});

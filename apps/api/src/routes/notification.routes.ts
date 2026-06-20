import { Router } from "express";
import {
  list,
  markAllRead,
  markRead,
  remove,
  unreadCount,
} from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

/**
 * Notification routes. Unlike every other resource, notifications have no
 * organization membership model: each notification belongs to exactly one
 * recipient, so authorization is simply "the caller is the owner". `requireAuth`
 * is applied to the whole router, and every service query is scoped by the
 * authenticated user's id — a caller can never read, mark, or delete another
 * user's notifications, and inaccessible ids return 404 (never 403) so existence
 * is not leaked.
 *
 * The literal `/unread-count` and `/read-all` routes are declared before the
 * `/:notificationId` routes; they are distinct path shapes, but listing them
 * first keeps the precedence obvious.
 */
export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get("/", list);
notificationRouter.get("/unread-count", unreadCount);
notificationRouter.patch("/read-all", markAllRead);
notificationRouter.patch("/:notificationId/read", markRead);
notificationRouter.delete("/:notificationId", remove);

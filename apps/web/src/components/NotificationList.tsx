"use client";

import { useEffect, useState } from "react";
import {
  ApiError,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "@/lib/api";
import { unreadCount } from "@/lib/notification-format";
import { NotificationItem } from "./NotificationItem";

type LoadState = "loading" | "ready" | "error";

// Maps an action failure to a friendly, status-aware message. 401/403/404 get
// specific copy; anything else falls back to the provided default.
function actionErrorMessage(caught: unknown, fallback: string): string {
  if (caught instanceof ApiError) {
    if (caught.statusCode === 401) {
      return "Your session has expired. Please log in again.";
    }
    if (caught.statusCode === 403) {
      return "You do not have permission to do that.";
    }
    if (caught.statusCode === 404) {
      return "That notification no longer exists.";
    }
    return caught.message;
  }
  return fallback;
}

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [actionError, setActionError] = useState<string | null>(null);
  // Id of the single item with an in-flight request, so only its actions disable.
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  useEffect(() => {
    let isActive = true;
    setState("loading");

    getNotifications()
      .then((loaded) => {
        if (!isActive) {
          return;
        }
        setNotifications(loaded);
        setState("ready");
      })
      .catch(() => {
        // All load failures (401/403/network) collapse to one error state, like
        // the activity feed. The page-level guard handles auth redirects.
        if (isActive) {
          setState("error");
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const unread = unreadCount(notifications);

  async function handleMarkRead(id: string) {
    setActionError(null);
    setBusyId(id);

    try {
      const updated = await markNotificationRead(id);
      // Replace with the server's copy so readAt reflects the canonical state.
      setNotifications((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (caught) {
      setActionError(actionErrorMessage(caught, "Could not mark this notification as read."));
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkAll() {
    setActionError(null);
    setIsMarkingAll(true);

    try {
      await markAllNotificationsRead();
      // Locally stamp every unread item read so the list and the derived unread
      // count update without a refetch.
      const now = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((item) => (item.readAt ? item : { ...item, readAt: now })),
      );
    } catch (caught) {
      setActionError(actionErrorMessage(caught, "Could not mark all notifications as read."));
    } finally {
      setIsMarkingAll(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this notification?")) {
      return;
    }

    setActionError(null);
    setBusyId(id);

    try {
      await deleteNotification(id);
      // Removing the item also drops it from the derived unread count.
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    } catch (caught) {
      setActionError(actionErrorMessage(caught, "Could not delete this notification."));
    } finally {
      setBusyId(null);
    }
  }

  if (state === "loading") {
    return <p className="mt-6 text-sm text-neutral-500">Loading notifications…</p>;
  }

  if (state === "error") {
    return (
      <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        Could not load notifications. Please refresh to try again.
      </p>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="mt-6 rounded-md border border-neutral-200 bg-white px-6 py-12 text-center">
        <p className="text-sm font-medium text-neutral-700">You&rsquo;re all caught up</p>
        <p className="mt-1 text-sm text-neutral-500">You have no notifications right now.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {unread > 0 ? `${unread} unread` : "No unread notifications"}
        </p>
        <button
          type="button"
          onClick={handleMarkAll}
          disabled={isMarkingAll || unread === 0}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isMarkingAll ? "Marking…" : "Mark all as read"}
        </button>
      </div>

      {actionError ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}

      <ul className="mt-4 flex flex-col gap-3">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkRead={handleMarkRead}
            onDelete={handleDelete}
            isBusy={busyId === notification.id}
          />
        ))}
      </ul>
    </div>
  );
}

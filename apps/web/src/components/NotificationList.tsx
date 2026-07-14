"use client";

import { BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { NotificationItem } from "./NotificationItem";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  ApiError,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "@/lib/api";
import { unreadCount } from "@/lib/notification-format";

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
    return (
      <div className="mt-6">
        <LoadingState label="Loading notifications…" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mt-6">
        <ErrorState message="Could not load notifications. Please refresh to try again." />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState
          variant="filtered"
          icon={BellOff}
          title="You're all caught up"
          description="You have no notifications right now. Updates about your tasks will appear here."
        />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm tabular-nums text-ink-muted" aria-live="polite">
          {unread > 0 ? `${unread} unread` : "No unread notifications"}
        </p>
        <Button size="sm" onClick={handleMarkAll} disabled={isMarkingAll || unread === 0}>
          {isMarkingAll ? "Marking…" : "Mark all as read"}
        </Button>
      </div>

      {actionError ? (
        <div className="mt-3">
          <ErrorState message={actionError} />
        </div>
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

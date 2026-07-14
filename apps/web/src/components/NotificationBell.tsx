"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUnreadNotificationCount } from "@/lib/api";
import { NotificationBadge } from "./NotificationBadge";

/**
 * Authenticated-shell entry point to notifications. Fetches the unread count
 * once on mount and links to the full /notifications page. The count is a
 * non-critical convenience, so a failed fetch is swallowed and the bell simply
 * shows no badge.
 */
export function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let isActive = true;

    getUnreadNotificationCount()
      .then((value) => {
        if (isActive) {
          setCount(value);
        }
      })
      .catch(() => {
        // Non-critical: leave the count at 0 rather than surfacing an error here.
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <Link
      href="/notifications"
      aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      title="Notifications"
      className="focus-ring relative inline-flex h-9 w-9 items-center justify-center rounded-field border border-edge bg-surface text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink"
    >
      <Bell aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.75} />
      {count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5">
          <NotificationBadge count={count} />
        </span>
      ) : null}
    </Link>
  );
}

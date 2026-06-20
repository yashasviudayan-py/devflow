"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getUnreadNotificationCount } from "@/lib/api";
import { NotificationBadge } from "./NotificationBadge";

/**
 * Authenticated-nav entry point to notifications. Fetches the unread count once on
 * mount and links to the full /notifications page (a page, not a dropdown, is the
 * simpler fit for the current per-page layout — there is no shared app shell to
 * anchor a popover to). The count is a non-critical convenience, so a failed fetch
 * is swallowed and the bell simply shows no badge.
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
      className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m6.714 0a3 3 0 1 1-6.714 0m6.714 0a23.94 23.94 0 0 1-6.714 0"
        />
      </svg>
      <span>Notifications</span>
      <NotificationBadge count={count} />
    </Link>
  );
}

import Link from "next/link";
import type { Notification } from "@/lib/api";
import {
  notificationActorName,
  notificationHref,
  notificationMessage,
  notificationTitle,
} from "@/lib/notification-format";

type NotificationItemProps = {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  // True while a request for this item is in flight, to disable its actions.
  isBusy: boolean;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  isBusy,
}: NotificationItemProps) {
  const isUnread = notification.readAt === null;
  const href = notificationHref(notification);
  const title = notificationTitle(notification);
  const message = notificationMessage(notification);
  const actorName = notificationActorName(notification);

  return (
    <li
      className={`flex gap-3 rounded-md border px-4 py-3 ${
        isUnread ? "border-emerald-200 bg-emerald-50/60" : "border-neutral-200 bg-white"
      }`}
    >
      <span
        aria-hidden
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
          isUnread ? "bg-emerald-600" : "bg-transparent"
        }`}
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-900">{title}</p>
        <p className="mt-0.5 break-words text-sm text-neutral-700">{message}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
          <span>{actorName}</span>
          <span aria-hidden>·</span>
          <time dateTime={notification.createdAt}>{formatDateTime(notification.createdAt)}</time>
          {href ? (
            <>
              <span aria-hidden>·</span>
              <Link href={href} className="font-medium text-emerald-700 hover:underline">
                View
              </Link>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {isUnread ? (
          <button
            type="button"
            onClick={() => onMarkRead(notification.id)}
            disabled={isBusy}
            className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Mark read
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onDelete(notification.id)}
          disabled={isBusy}
          className="rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

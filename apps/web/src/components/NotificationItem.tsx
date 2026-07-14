import { Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
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
      className={`flex gap-3 rounded-card border px-4 py-3.5 ${
        isUnread ? "border-brand-200 bg-brand-50/50" : "border-edge-subtle bg-surface"
      }`}
    >
      <span
        aria-hidden
        className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
          isUnread ? "bg-brand-600" : "bg-transparent"
        }`}
      />

      <div className="min-w-0 flex-1">
        <p className={`text-sm text-ink ${isUnread ? "font-semibold" : "font-medium"}`}>
          {title}
          {isUnread ? <span className="sr-only"> (unread)</span> : null}
        </p>
        <p className="mt-0.5 break-words text-sm leading-6 text-ink-secondary">{message}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
          <span>{actorName}</span>
          <span aria-hidden>·</span>
          <time dateTime={notification.createdAt} className="tabular-nums">
            {formatDateTime(notification.createdAt)}
          </time>
          {href ? (
            <>
              <span aria-hidden>·</span>
              <Link
                href={href}
                className="focus-ring rounded font-medium text-brand-700 hover:text-brand-800 hover:underline"
              >
                View
              </Link>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {isUnread ? (
          <Button size="sm" onClick={() => onMarkRead(notification.id)} disabled={isBusy}>
            Mark read
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(notification.id)}
          disabled={isBusy}
          aria-label="Delete notification"
          title="Delete notification"
          className="text-ink-muted hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        </Button>
      </div>
    </li>
  );
}

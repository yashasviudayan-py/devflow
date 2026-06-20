type NotificationBadgeProps = {
  count: number;
};

/**
 * A small unread-count pill. Renders nothing when the count is zero so the UI is
 * not noisy when there is nothing to see. Counts above 99 collapse to "99+".
 */
export function NotificationBadge({ count }: NotificationBadgeProps) {
  if (count <= 0) {
    return null;
  }

  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      aria-hidden
      className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-700 px-1.5 py-0.5 text-xs font-semibold leading-none text-white"
    >
      {label}
    </span>
  );
}

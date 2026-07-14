import { activityActorName, describeActivity, type ActivityContext } from "@/lib/activity-format";
import type { ActivityLog } from "@/lib/api";

type ActivityTimelineItemProps = {
  log: ActivityLog;
  context: ActivityContext;
  // Resolves a user id to a display name (used for assignment messages). Optional;
  // the formatter falls back to "a member" when a name cannot be resolved.
  resolveUserName?: (userId: string) => string | undefined;
  // The last item ends the timeline, so it draws no connecting line below its dot.
  isLast?: boolean;
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

// Destructive history reads in a warmer tone; everything else stays neutral.
const destructiveWords = ["DELETED", "ARCHIVED", "REMOVED"];

function isDestructive(log: ActivityLog): boolean {
  const action = String(log.action).toUpperCase();
  return destructiveWords.some((word) => action.includes(word));
}

export function ActivityTimelineItem({
  log,
  context,
  resolveUserName,
  isLast = false,
}: ActivityTimelineItemProps) {
  const actorName = activityActorName(log);
  const message = describeActivity(log, { context, resolveUserName });
  const destructive = isDestructive(log);

  return (
    <li className="relative flex gap-3 pl-0.5">
      {/* Timeline spine: dot plus a hairline connecting to the next entry. */}
      <span aria-hidden className="relative flex w-3 shrink-0 justify-center">
        <span
          className={`mt-1.5 h-2 w-2 rounded-full ring-4 ring-canvas ${
            destructive ? "bg-red-400" : "bg-brand-500"
          }`}
        />
        {!isLast ? (
          <span className="absolute bottom-[-1.25rem] top-4 w-px bg-edge" />
        ) : null}
      </span>

      <div className="min-w-0 pb-0.5">
        <p className="text-sm leading-6 text-ink-secondary">
          <span className="font-semibold text-ink">{actorName}</span> {message}
        </p>
        <time dateTime={log.createdAt} className="text-xs tabular-nums text-ink-muted">
          {formatDateTime(log.createdAt)}
        </time>
      </div>
    </li>
  );
}

import { activityActorName, describeActivity, type ActivityContext } from "@/lib/activity-format";
import type { ActivityLog } from "@/lib/api";

type ActivityTimelineItemProps = {
  log: ActivityLog;
  context: ActivityContext;
  // Resolves a user id to a display name (used for assignment messages). Optional;
  // the formatter falls back to "a member" when a name cannot be resolved.
  resolveUserName?: (userId: string) => string | undefined;
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

export function ActivityTimelineItem({ log, context, resolveUserName }: ActivityTimelineItemProps) {
  const actorName = activityActorName(log);
  const message = describeActivity(log, { context, resolveUserName });

  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-neutral-300"
      />
      <div className="min-w-0">
        <p className="text-sm text-neutral-800">
          <span className="font-medium text-neutral-900">{actorName}</span> {message}
        </p>
        <time dateTime={log.createdAt} className="text-xs text-neutral-500">
          {formatDateTime(log.createdAt)}
        </time>
      </div>
    </li>
  );
}

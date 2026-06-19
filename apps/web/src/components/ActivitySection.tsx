"use client";

import { useEffect, useState } from "react";
import { ActivityTimelineItem } from "@/components/ActivityTimelineItem";
import type { ActivityContext } from "@/lib/activity-format";
import {
  getProjectActivity,
  getTaskActivity,
  type ActivityLog,
  type OrganizationMember,
} from "@/lib/api";

type ActivitySectionProps = {
  // "task" fetches the task feed; "project" fetches the project feed. The value
  // also doubles as the formatting context ("this task" vs "a task").
  source: ActivityContext;
  // Task id or project id, matching `source`.
  id: string;
  // Organization members, used to show assignee names in assignment events.
  members: OrganizationMember[];
};

type LoadState = "loading" | "ready" | "error";

export function ActivitySection({ source, id, members }: ActivitySectionProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let isActive = true;
    setState("loading");

    const load = source === "task" ? getTaskActivity(id) : getProjectActivity(id);

    load
      .then((loaded) => {
        if (!isActive) {
          return;
        }
        setLogs(loaded);
        setState("ready");
      })
      .catch(() => {
        // All failures (401/403/404/network) collapse to one error state. The
        // page-level guard handles auth redirects, and the activity endpoints use
        // the same membership check as the page itself, so a member who can see
        // this page can also load its activity — we never leak inaccessible data.
        if (isActive) {
          setState("error");
        }
      });

    return () => {
      isActive = false;
    };
  }, [source, id]);

  // Assignment events store user ids; resolve them to names via the member list.
  function resolveUserName(userId: string) {
    return members.find((member) => member.user.id === userId)?.user.name;
  }

  return (
    <section className="mt-6 rounded-md border border-neutral-200 bg-white p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Activity</h2>

      <div className="mt-4">
        {state === "loading" ? (
          <p className="text-sm text-neutral-500">Loading activity…</p>
        ) : state === "error" ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Could not load activity. Please refresh to try again.
          </p>
        ) : logs.length === 0 ? (
          <p className="text-sm italic text-neutral-400">No activity yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {logs.map((log) => (
              <ActivityTimelineItem
                key={log.id}
                log={log}
                context={source}
                resolveUserName={resolveUserName}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

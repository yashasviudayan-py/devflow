"use client";

import { useEffect, useState } from "react";
import { ActivityTimelineItem } from "@/components/ActivityTimelineItem";
import { SectionHeader } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/states";
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
    <section className="mt-10">
      <SectionHeader title="Activity" />

      <div className="mt-4">
        {state === "loading" ? (
          <LoadingState label="Loading activity…" />
        ) : state === "error" ? (
          <ErrorState message="Could not load activity. Please refresh to try again." />
        ) : logs.length === 0 ? (
          <p className="rounded-card border border-edge-subtle bg-surface px-4 py-6 text-center text-sm text-ink-muted">
            No activity yet.
          </p>
        ) : (
          <ol className="relative flex flex-col gap-5 pl-1">
            {logs.map((log, index) => (
              <ActivityTimelineItem
                key={log.id}
                log={log}
                context={source}
                resolveUserName={resolveUserName}
                isLast={index === logs.length - 1}
              />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

"use client";

import type { UserRole } from "@devflow/shared";
import { useEffect, useState } from "react";
import { CommentForm } from "@/components/CommentForm";
import { CommentItem } from "@/components/CommentItem";
import { SectionHeader } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { getTaskComments, type Comment } from "@/lib/api";

type CommentsSectionProps = {
  taskId: string;
  currentUserId: string | null;
  role: UserRole | null;
  // Whether the current role may post comments (VIEWER is read-only).
  canComment: boolean;
};

type LoadState = "loading" | "ready" | "error";

export function CommentsSection({
  taskId,
  currentUserId,
  role,
  canComment,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let isActive = true;
    setState("loading");

    getTaskComments(taskId)
      .then((loaded) => {
        if (!isActive) {
          return;
        }
        setComments(loaded);
        setState("ready");
      })
      .catch(() => {
        // All failures (401/403/404/network) collapse to one error state: the
        // page-level guard already handles auth redirects, and we never leak
        // whether an inaccessible task exists.
        if (isActive) {
          setState("error");
        }
      });

    return () => {
      isActive = false;
    };
  }, [taskId]);

  function handleCreated(comment: Comment) {
    // Comments are sorted oldest-first, so a new one appends to the end.
    setComments((current) => [...current, comment]);
  }

  function handleUpdated(updated: Comment) {
    setComments((current) =>
      current.map((comment) => (comment.id === updated.id ? updated : comment)),
    );
  }

  function handleDeleted(commentId: string) {
    setComments((current) => current.filter((comment) => comment.id !== commentId));
  }

  return (
    <section className="mt-10">
      <SectionHeader
        title="Comments"
        count={state === "ready" ? comments.length : undefined}
      />

      <div className="mt-4">
        {state === "loading" ? (
          <LoadingState label="Loading comments…" />
        ) : state === "error" ? (
          <ErrorState message="Could not load comments. Please refresh to try again." />
        ) : comments.length === 0 ? (
          <p className="rounded-card border border-edge-subtle bg-surface px-4 py-6 text-center text-sm text-ink-muted">
            No comments yet.{canComment ? " Start the conversation below." : ""}
          </p>
        ) : (
          <ul className="flex flex-col gap-5">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                role={role}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))}
          </ul>
        )}
      </div>

      {canComment ? (
        <div className="mt-6 border-t border-edge-subtle pt-6">
          <CommentForm taskId={taskId} onCreated={handleCreated} />
        </div>
      ) : (
        <p className="mt-6 border-t border-edge-subtle pt-6 text-sm text-ink-muted">
          You have read-only access and cannot post comments.
        </p>
      )}
    </section>
  );
}

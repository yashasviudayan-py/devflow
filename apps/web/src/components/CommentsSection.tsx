"use client";

import type { UserRole } from "@devflow/shared";
import { useEffect, useState } from "react";
import { CommentForm } from "@/components/CommentForm";
import { CommentItem } from "@/components/CommentItem";
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
    <section className="mt-6 rounded-md border border-neutral-200 bg-white p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Comments
      </h2>

      <div className="mt-4">
        {state === "loading" ? (
          <p className="text-sm text-neutral-500">Loading comments…</p>
        ) : state === "error" ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Could not load comments. Please refresh to try again.
          </p>
        ) : comments.length === 0 ? (
          <p className="text-sm italic text-neutral-400">
            No comments yet. {canComment ? "Start the conversation below." : ""}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
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
        <div className="mt-6 border-t border-neutral-200 pt-6">
          <CommentForm taskId={taskId} onCreated={handleCreated} />
        </div>
      ) : (
        <p className="mt-6 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
          You have read-only access and cannot post comments.
        </p>
      )}
    </section>
  );
}

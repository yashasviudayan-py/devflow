"use client";

import { updateCommentSchema, type UserRole } from "@devflow/shared";
import { useState, type FormEvent } from "react";
import { FormAlert } from "@/components/AuthCard";
import {
  ApiError,
  deleteComment as deleteCommentRequest,
  updateComment as updateCommentRequest,
  type Comment,
} from "@/lib/api";
import { canDeleteComment, canEditComment } from "@/lib/commentPermissions";

type CommentItemProps = {
  comment: Comment;
  currentUserId: string | null;
  role: UserRole | null;
  onUpdated: (comment: Comment) => void;
  onDeleted: (commentId: string) => void;
};

const textareaClassName =
  "mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function describeError(error: unknown, action: string): string {
  if (error instanceof ApiError && error.statusCode === 403) {
    return `You do not have permission to ${action} this comment.`;
  }
  if (error instanceof ApiError && error.statusCode === 404) {
    return "This comment is no longer available.";
  }
  if (error instanceof ApiError) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function CommentItem({
  comment,
  currentUserId,
  role,
  onUpdated,
  onDeleted,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = canEditComment(comment, currentUserId);
  const canDelete = canDeleteComment(comment, currentUserId, role);
  const wasEdited = comment.updatedAt !== comment.createdAt;
  const authorName = comment.author?.name ?? "Unknown user";

  function startEditing() {
    setDraft(comment.body);
    setFieldError(undefined);
    setActionError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    // Cancel restores the original content by discarding the draft.
    setDraft(comment.body);
    setFieldError(undefined);
    setIsEditing(false);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);

    const parsed = updateCommentSchema.safeParse({ body: draft });

    if (!parsed.success) {
      setFieldError(parsed.error.flatten().fieldErrors.body?.[0]);
      return;
    }

    setFieldError(undefined);
    setIsSaving(true);

    try {
      const updated = await updateCommentRequest(comment.id, parsed.data);
      onUpdated(updated);
      setIsEditing(false);
    } catch (error) {
      setActionError(describeError(error, "edit"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this comment? This cannot be undone.")) {
      return;
    }

    setActionError(null);
    setIsDeleting(true);

    try {
      await deleteCommentRequest(comment.id);
      onDeleted(comment.id);
    } catch (error) {
      setActionError(describeError(error, "delete"));
      setIsDeleting(false);
    }
  }

  return (
    <li className="rounded-md border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <span className="text-sm font-medium text-neutral-900">{authorName}</span>
          {comment.author?.email ? (
            <span className="ml-2 text-xs text-neutral-500">{comment.author.email}</span>
          ) : null}
        </div>
        <span className="text-xs text-neutral-500">
          {formatDateTime(comment.createdAt)}
          {wasEdited ? " · edited" : ""}
        </span>
      </div>

      {actionError ? (
        <div className="mt-3">
          <FormAlert message={actionError} />
        </div>
      ) : null}

      {isEditing ? (
        <form onSubmit={handleSave} noValidate className="mt-3 flex flex-col gap-3">
          <div>
            <label htmlFor={`comment-${comment.id}-body`} className="sr-only">
              Edit comment
            </label>
            <textarea
              id={`comment-${comment.id}-body`}
              rows={3}
              value={draft}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={fieldError ? `comment-${comment.id}-error` : undefined}
              onChange={(event) => setDraft(event.target.value)}
              className={textareaClassName}
            />
            {fieldError ? (
              <p id={`comment-${comment.id}-error`} className="mt-1 text-sm text-red-600">
                {fieldError}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              disabled={isSaving}
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="mt-2 whitespace-pre-line text-sm text-neutral-800">{comment.body}</p>

          {canEdit || canDelete ? (
            <div className="mt-3 flex items-center gap-3 text-sm">
              {canEdit ? (
                <button
                  type="button"
                  onClick={startEditing}
                  className="font-medium text-emerald-700 hover:underline"
                >
                  Edit
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="font-medium text-red-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleting ? "Deleting…" : "Delete"}
                </button>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </li>
  );
}

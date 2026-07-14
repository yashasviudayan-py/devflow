"use client";

import { updateCommentSchema, type UserRole } from "@devflow/shared";
import { useState, type FormEvent } from "react";
import { FormAlert } from "@/components/AuthCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { fieldErrorProps, Textarea } from "@/components/ui/fields";
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

  const errorFieldId = `comment-${comment.id}-body`;

  return (
    <li className="flex gap-3">
      <Avatar name={authorName} size="md" className="mt-0.5" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-sm font-semibold text-ink">{authorName}</span>
          <span className="text-xs tabular-nums text-ink-muted">
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
          <form onSubmit={handleSave} noValidate className="mt-2 flex flex-col gap-3">
            <div>
              <label htmlFor={errorFieldId} className="sr-only">
                Edit comment
              </label>
              <Textarea
                id={errorFieldId}
                rows={3}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                {...fieldErrorProps(errorFieldId, fieldError)}
              />
              {fieldError ? (
                <p id={`${errorFieldId}-error`} className="mt-1.5 text-sm text-red-600">
                  {fieldError}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                {isSaving ? "Saving…" : "Save"}
              </Button>
              <Button size="sm" onClick={cancelEditing} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-ink-secondary">
              {comment.body}
            </p>

            {canEdit || canDelete ? (
              <div className="mt-1.5 flex items-center gap-1">
                {canEdit ? (
                  <Button variant="ghost" size="sm" onClick={startEditing} className="-ml-3">
                    Edit
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={`text-red-700 hover:bg-red-50 hover:text-red-800 ${canEdit ? "" : "-ml-3"}`}
                  >
                    {isDeleting ? "Deleting…" : "Delete"}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </li>
  );
}

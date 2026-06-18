import type { UserRole } from "@devflow/shared";
import type { Comment } from "@/lib/api";

/**
 * Comment authorization mirrors the backend so the UI only shows actions the API
 * will actually allow:
 *
 * - Editing is author-only (PATCH /comments/:id checks ownership).
 * - Deleting is allowed for the author, and additionally for OWNER/ADMIN, who can
 *   moderate any comment in their organization (DELETE /comments/:id).
 *
 * These are conservative gates: the server is still the source of truth and
 * re-checks every request, so a hidden button is a UX nicety, not the boundary.
 */
export function isCommentAuthor(
  comment: Pick<Comment, "authorId">,
  userId: string | null,
): boolean {
  return userId !== null && comment.authorId === userId;
}

export function canEditComment(
  comment: Pick<Comment, "authorId">,
  userId: string | null,
): boolean {
  return isCommentAuthor(comment, userId);
}

export function canDeleteComment(
  comment: Pick<Comment, "authorId">,
  userId: string | null,
  role: UserRole | null,
): boolean {
  return isCommentAuthor(comment, userId) || role === "OWNER" || role === "ADMIN";
}

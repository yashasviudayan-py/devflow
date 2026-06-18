import { describe, expect, it } from "vitest";
import type { Comment } from "./api";
import { canDeleteComment, canEditComment, isCommentAuthor } from "./commentPermissions";

function makeComment(authorId: string | null): Comment {
  return {
    id: "comment-1",
    taskId: "task-1",
    authorId,
    body: "Looks good",
    createdAt: "2026-06-18T00:00:00.000Z",
    updatedAt: "2026-06-18T00:00:00.000Z",
    author: authorId ? { id: authorId, name: "Author", email: "author@example.com" } : null,
  };
}

describe("isCommentAuthor", () => {
  it("is true when the comment author matches the user", () => {
    expect(isCommentAuthor(makeComment("user-1"), "user-1")).toBe(true);
  });

  it("is false for a different user", () => {
    expect(isCommentAuthor(makeComment("user-1"), "user-2")).toBe(false);
  });

  it("is false when there is no current user", () => {
    expect(isCommentAuthor(makeComment("user-1"), null)).toBe(false);
  });

  it("is false when the comment has no author", () => {
    expect(isCommentAuthor(makeComment(null), "user-1")).toBe(false);
  });
});

describe("canEditComment", () => {
  it("allows the author to edit", () => {
    expect(canEditComment(makeComment("user-1"), "user-1")).toBe(true);
  });

  it("does not allow a non-author to edit, even an admin", () => {
    // Editing is author-only on the backend; role does not grant edit rights.
    expect(canEditComment(makeComment("user-1"), "user-2")).toBe(false);
  });
});

describe("canDeleteComment", () => {
  it("allows the author to delete their own comment", () => {
    expect(canDeleteComment(makeComment("user-1"), "user-1", "MEMBER")).toBe(true);
  });

  it("allows an OWNER to delete another member's comment", () => {
    expect(canDeleteComment(makeComment("user-1"), "user-2", "OWNER")).toBe(true);
  });

  it("allows an ADMIN to delete another member's comment", () => {
    expect(canDeleteComment(makeComment("user-1"), "user-2", "ADMIN")).toBe(true);
  });

  it("does not allow a non-author MEMBER to delete", () => {
    expect(canDeleteComment(makeComment("user-1"), "user-2", "MEMBER")).toBe(false);
  });

  it("does not allow a non-author VIEWER to delete", () => {
    expect(canDeleteComment(makeComment("user-1"), "user-2", "VIEWER")).toBe(false);
  });
});

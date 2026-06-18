import type { CreateCommentInput, UpdateCommentInput } from "@devflow/shared";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

// Only safe, public user fields are ever exposed on the nested author object.
// `passwordHash` is intentionally absent and never selected here.
const commentUserSelect = {
  id: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;

const commentSelect = {
  id: true,
  taskId: true,
  authorId: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  author: { select: commentUserSelect },
} satisfies Prisma.CommentSelect;

export type CommentRecord = Prisma.CommentGetPayload<{
  select: typeof commentSelect;
}>;

// Used by the comment middleware to resolve the organization that owns a comment
// (comment -> task -> project -> organization) for the authorization check.
export type CommentWithOrganization = CommentRecord & {
  task: { project: { organizationId: string } };
};

export async function createComment(taskId: string, authorId: string, input: CreateCommentInput) {
  return prisma.comment.create({
    data: {
      taskId,
      authorId,
      body: input.body,
    },
    select: commentSelect,
  });
}

export async function listComments(taskId: string) {
  // Comments read top-to-bottom in the order they were written.
  return prisma.comment.findMany({
    where: {
      taskId,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: commentSelect,
  });
}

export async function getCommentWithOrganization(
  commentId: string,
): Promise<CommentWithOrganization | null> {
  return prisma.comment.findUnique({
    where: {
      id: commentId,
    },
    select: {
      ...commentSelect,
      task: {
        select: {
          project: {
            select: {
              organizationId: true,
            },
          },
        },
      },
    },
  });
}

export async function updateComment(commentId: string, input: UpdateCommentInput) {
  return prisma.comment.update({
    where: {
      id: commentId,
    },
    data: {
      body: input.body,
    },
    select: commentSelect,
  });
}

// Comments have no soft-delete column, so deletion is a hard delete. Deleting a
// task cascades to its comments, so this only handles explicit comment removal.
export async function deleteComment(commentId: string) {
  await prisma.comment.delete({
    where: {
      id: commentId,
    },
  });
}

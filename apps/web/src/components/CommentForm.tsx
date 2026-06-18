"use client";

import { createCommentSchema } from "@devflow/shared";
import { useState, type FormEvent } from "react";
import { FormAlert, SubmitButton } from "@/components/AuthCard";
import { ApiError, createTaskComment, type Comment } from "@/lib/api";

type CommentFormProps = {
  taskId: string;
  onCreated: (comment: Comment) => void;
};

const textareaClassName =
  "mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";

export function CommentForm({ taskId, onCreated }: CommentFormProps) {
  const [body, setBody] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = createCommentSchema.safeParse({ body });

    if (!parsed.success) {
      setFieldError(parsed.error.flatten().fieldErrors.body?.[0]);
      return;
    }

    setFieldError(undefined);
    setIsSubmitting(true);

    try {
      const comment = await createTaskComment(taskId, parsed.data);
      onCreated(comment);
      setBody("");
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 403) {
        setFormError("You do not have permission to comment on this task.");
      } else if (error instanceof ApiError && error.statusCode === 404) {
        setFormError("This task is no longer available.");
      } else if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      {formError ? <FormAlert message={formError} /> : null}

      <div>
        <label htmlFor="comment-body" className="block text-sm font-medium text-neutral-700">
          Add a comment
        </label>
        <textarea
          id="comment-body"
          name="body"
          rows={3}
          value={body}
          placeholder="Share an update or ask a question…"
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? "comment-body-error" : undefined}
          onChange={(event) => setBody(event.target.value)}
          className={textareaClassName}
        />
        {fieldError ? (
          <p id="comment-body-error" className="mt-1 text-sm text-red-600">
            {fieldError}
          </p>
        ) : null}
      </div>

      <div className="sm:max-w-[12rem]">
        <SubmitButton label="Post comment" pendingLabel="Posting…" isPending={isSubmitting} />
      </div>
    </form>
  );
}

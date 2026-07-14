"use client";

import { createCommentSchema } from "@devflow/shared";
import { useState, type FormEvent } from "react";
import { FormAlert, SubmitButton } from "@/components/AuthCard";
import { fieldErrorProps, FormField, Textarea } from "@/components/ui/fields";
import { ApiError, createTaskComment, type Comment } from "@/lib/api";

type CommentFormProps = {
  taskId: string;
  onCreated: (comment: Comment) => void;
};

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

      <FormField htmlFor="comment-body" label="Add a comment" error={fieldError}>
        <Textarea
          id="comment-body"
          name="body"
          rows={3}
          value={body}
          placeholder="Share an update or ask a question…"
          onChange={(event) => setBody(event.target.value)}
          {...fieldErrorProps("comment-body", fieldError)}
        />
      </FormField>

      <div className="sm:max-w-[12rem]">
        <SubmitButton label="Post comment" pendingLabel="Posting…" isPending={isSubmitting} />
      </div>
    </form>
  );
}

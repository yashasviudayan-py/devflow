"use client";

import { updateProjectSchema } from "@devflow/shared";
import { useState, type FormEvent } from "react";
import { FormAlert, SubmitButton, TextField } from "@/components/AuthCard";
import { Button } from "@/components/ui/Button";
import { fieldErrorProps, FormField, Textarea } from "@/components/ui/fields";
import { ApiError, updateProject, type Project } from "@/lib/api";

type FieldErrors = Partial<Record<"name" | "description", string>>;

type EditProjectFormProps = {
  project: Project;
  onCancel: () => void;
  onSaved: (project: Project) => void;
};

export function EditProjectForm({ project, onCancel, onSaved }: EditProjectFormProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    // Send an empty description as "" so it can be cleared; the schema allows it.
    const parsed = updateProjectSchema.safeParse({
      name,
      description: description.trim(),
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        name: errors.name?.[0],
        description: errors.description?.[0],
      });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const updated = await updateProject(project.id, parsed.data);
      onSaved(updated);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 403) {
        setFormError("You do not have permission to edit this project.");
      } else if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <FormAlert message={formError} /> : null}

      <TextField
        label="Project name"
        name="name"
        type="text"
        autoComplete="off"
        value={name}
        error={fieldErrors.name}
        onChange={setName}
      />

      <FormField htmlFor="description" label="Description (optional)" error={fieldErrors.description}>
        <Textarea
          id="description"
          name="description"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          {...fieldErrorProps("description", fieldErrors.description)}
        />
      </FormField>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <SubmitButton label="Save changes" pendingLabel="Saving…" isPending={isSubmitting} />
        </div>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

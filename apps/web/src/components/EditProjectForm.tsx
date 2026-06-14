"use client";

import { updateProjectSchema } from "@devflow/shared";
import { useState, type FormEvent } from "react";
import { FormAlert, SubmitButton, TextField } from "@/components/AuthCard";
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

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={description}
          aria-invalid={fieldErrors.description ? true : undefined}
          aria-describedby={fieldErrors.description ? "description-error" : undefined}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
        />
        {fieldErrors.description ? (
          <p id="description-error" className="mt-1 text-sm text-red-600">
            {fieldErrors.description}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <SubmitButton label="Save changes" pendingLabel="Saving…" isPending={isSubmitting} />
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

"use client";

import { createProjectSchema } from "@devflow/shared";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormAlert, SubmitButton, TextField } from "@/components/AuthCard";
import { ApiError, createProject } from "@/lib/api";

type FieldErrors = Partial<Record<"name" | "description", string>>;

export function CreateProjectForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    // Description is optional; an empty input means "no description".
    const parsed = createProjectSchema.safeParse({
      name,
      description: description.trim() === "" ? undefined : description,
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
      const project = await createProject(organizationId, parsed.data);
      router.push(`/projects/${project.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 403) {
        setFormError("You do not have permission to create projects in this organization.");
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

      <SubmitButton label="Create project" pendingLabel="Creating…" isPending={isSubmitting} />
    </form>
  );
}

"use client";

import { createProjectSchema } from "@devflow/shared";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormAlert, SubmitButton, TextField } from "@/components/AuthCard";
import { fieldErrorProps, FormField, Textarea } from "@/components/ui/fields";
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

      <SubmitButton label="Create project" pendingLabel="Creating…" isPending={isSubmitting} />
    </form>
  );
}

"use client";

import { createOrganizationSchema } from "@devflow/shared";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormAlert, SubmitButton, TextField } from "@/components/AuthCard";
import { setActiveOrganizationId } from "@/lib/activeOrganization";
import { ApiError, createOrganization } from "@/lib/api";

type FieldErrors = Partial<Record<"name" | "slug", string>>;

export function CreateOrganizationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    // The slug is optional; an empty input means "let the API generate one".
    const parsed = createOrganizationSchema.safeParse({
      name,
      slug: slug.trim() === "" ? undefined : slug,
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        name: errors.name?.[0],
        slug: errors.slug?.[0],
      });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const organization = await createOrganization(parsed.data);
      setActiveOrganizationId(organization.id);
      router.push(`/organizations/${organization.id}`);
    } catch (error) {
      if (error instanceof ApiError) {
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
        label="Organization name"
        name="name"
        type="text"
        autoComplete="organization"
        value={name}
        error={fieldErrors.name}
        onChange={setName}
      />
      <div>
        <TextField
          label="Slug (optional)"
          name="slug"
          type="text"
          autoComplete="off"
          value={slug}
          error={fieldErrors.slug}
          onChange={setSlug}
        />
        <p className="mt-1.5 text-xs text-ink-muted">
          Lowercase letters, numbers, and hyphens. Leave blank to generate one from the name.
        </p>
      </div>

      <SubmitButton
        label="Create organization"
        pendingLabel="Creating…"
        isPending={isSubmitting}
      />
    </form>
  );
}

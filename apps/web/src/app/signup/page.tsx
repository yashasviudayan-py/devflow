"use client";

import { signupSchema } from "@devflow/shared";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthCard, FormAlert, SubmitButton, TextField } from "@/components/AuthCard";
import { ApiError, signup } from "@/lib/api";

type FieldErrors = Partial<Record<"name" | "email" | "password", string>>;

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = signupSchema.safeParse({ name, email, password });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        name: errors.name?.[0],
        email: errors.email?.[0],
        password: errors.password?.[0],
      });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await signup(parsed.data);
      router.push("/dashboard");
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
    <AuthCard
      title="Create your account"
      description="Start managing projects with DevFlow."
      footer={{ prompt: "Already have an account?", linkLabel: "Log in", linkHref: "/login" }}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {formError ? <FormAlert message={formError} /> : null}

        <TextField
          label="Name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          error={fieldErrors.name}
          onChange={setName}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          error={fieldErrors.email}
          onChange={setEmail}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          error={fieldErrors.password}
          onChange={setPassword}
        />

        <SubmitButton label="Create account" pendingLabel="Creating account…" isPending={isSubmitting} />
      </form>
    </AuthCard>
  );
}

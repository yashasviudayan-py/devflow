"use client";

import { loginSchema } from "@devflow/shared";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthCard, FormAlert, SubmitButton, TextField } from "@/components/AuthCard";
import { ApiError, login } from "@/lib/api";

type FieldErrors = Partial<Record<"email" | "password", string>>;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: errors.email?.[0],
        password: errors.password?.[0],
      });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await login(parsed.data);
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        setFormError("Invalid email or password.");
      } else if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Log in"
      description="Welcome back. Enter your credentials to continue."
      footer={{ prompt: "New to DevFlow?", linkLabel: "Create an account", linkHref: "/signup" }}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {formError ? <FormAlert message={formError} /> : null}

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
          autoComplete="current-password"
          value={password}
          error={fieldErrors.password}
          onChange={setPassword}
        />

        <SubmitButton label="Log in" pendingLabel="Logging in…" isPending={isSubmitting} />
      </form>
    </AuthCard>
  );
}

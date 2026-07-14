"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/Alert";
import { BrandMark } from "@/components/ui/BrandMark";
import { Button } from "@/components/ui/Button";
import { fieldErrorProps, FormField, Input } from "@/components/ui/fields";

type AuthCardProps = {
  title: string;
  description: string;
  footer: {
    prompt: string;
    linkLabel: string;
    linkHref: string;
  };
  /** "md" fits credential forms; "lg" gives multi-field forms room to breathe. */
  width?: "md" | "lg";
  children: ReactNode;
};

/**
 * Centered focused-task surface used by the auth pages and the create flows
 * (organization / project / task). One calm card on the canvas, brand on top,
 * a single escape hatch below.
 */
export function AuthCard({ title, description, footer, width = "md", children }: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10 text-ink">
      <div className={`w-full ${width === "lg" ? "max-w-xl" : "max-w-md"}`}>
        <div className="mb-6 flex justify-center">
          <BrandMark href="/" />
        </div>

        <div className="rounded-modal border border-edge-subtle bg-surface p-6 shadow-raised sm:p-8">
          <h1 className="text-headline text-ink">{title}</h1>
          <p className="mt-1.5 text-sm leading-6 text-ink-muted">{description}</p>

          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-5 text-center text-sm text-ink-muted">
          {footer.prompt}{" "}
          <Link
            href={footer.linkHref}
            className="focus-ring rounded font-medium text-brand-700 hover:text-brand-800 hover:underline"
          >
            {footer.linkLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}

type TextFieldProps = {
  label: string;
  name: string;
  type: string;
  value: string;
  autoComplete: string;
  error?: string;
  onChange: (value: string) => void;
};

/**
 * Single-line labelled input. Password fields get a visibility toggle; the
 * value and change handling are untouched by the toggle.
 */
export function TextField({
  label,
  name,
  type,
  value,
  autoComplete,
  error,
  onChange,
}: TextFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <FormField htmlFor={name} label={label} error={error}>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={inputType}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          className={isPassword ? "pr-10" : undefined}
          {...fieldErrorProps(name, error)}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="focus-ring absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-field text-ink-muted transition-colors hover:text-ink"
          >
            {showPassword ? (
              <EyeOff aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Eye aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        ) : null}
      </div>
    </FormField>
  );
}

export function FormAlert({ message }: { message: string }) {
  return <Alert>{message}</Alert>;
}

export function SubmitButton({
  label,
  pendingLabel,
  isPending,
}: {
  label: string;
  pendingLabel: string;
  isPending: boolean;
}) {
  return (
    <Button type="submit" variant="primary" isLoading={isPending} className="w-full">
      {isPending ? pendingLabel : label}
    </Button>
  );
}

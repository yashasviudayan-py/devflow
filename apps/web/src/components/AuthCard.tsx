import Link from "next/link";
import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  description: string;
  footer: {
    prompt: string;
    linkLabel: string;
    linkHref: string;
  };
  children: ReactNode;
};

export function AuthCard({ title, description, footer, children }: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10 text-neutral-950">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-emerald-700">
          <Link href="/">DevFlow</Link>
        </p>

        <div className="rounded-md border border-neutral-200 bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-neutral-950">{title}</h1>
          <p className="mt-1 text-sm text-neutral-600">{description}</p>

          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-4 text-center text-sm text-neutral-600">
          {footer.prompt}{" "}
          <Link href={footer.linkHref} className="font-medium text-emerald-700 hover:underline">
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

export function TextField({ label, name, type, value, autoComplete, error, onChange }: TextFieldProps) {
  const errorId = `${name}-error`;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-neutral-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
      />
      {error ? (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormAlert({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}

export function SubmitButton({ label, pendingLabel, isPending }: {
  label: string;
  pendingLabel: string;
  isPending: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? pendingLabel : label}
    </button>
  );
}

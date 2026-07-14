import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

type AlertProps = {
  variant?: "error" | "success";
  children: ReactNode;
  className?: string;
};

const variantClasses = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-brand-200 bg-brand-50 text-brand-800",
} as const;

/** Inline feedback surface for form errors and action failures/successes. */
export function Alert({ variant = "error", children, className = "" }: AlertProps) {
  const Icon = variant === "error" ? AlertCircle : CheckCircle2;

  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-field border px-3 py-2.5 text-sm ${variantClasses[variant]} ${className}`}
    >
      <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

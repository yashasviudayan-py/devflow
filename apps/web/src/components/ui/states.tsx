import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  /** Primary call to action (a Button or a styled Link). */
  action?: ReactNode;
  /** Dashed border marks a "nothing created yet" invitation to act. */
  variant?: "empty" | "filtered";
};

/**
 * Shared empty surface. "empty" is the true no-data state (dashed, with an
 * icon and a create action); "filtered" is "your filters matched nothing"
 * (solid, quieter, usually with a reset action).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "empty",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-card border bg-surface px-6 py-12 text-center ${
        variant === "empty" ? "border-dashed border-edge-strong" : "border-edge-subtle"
      }`}
    >
      {Icon ? (
        <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Icon aria-hidden className="h-5 w-5" strokeWidth={1.75} />
        </span>
      ) : null}
      <h3 className="text-title text-ink">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-ink-muted">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

/** Compact inline loading row for sections that fetch after mount. */
export function LoadingState({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 py-1 text-sm text-ink-muted">
      <Spinner className="h-3.5 w-3.5" />
      {label}
    </p>
  );
}

/** Error surface for failed section loads, with an optional retry hint baked into copy. */
export function ErrorState({ message }: { message: string }) {
  return <Alert>{message}</Alert>;
}

/** Layout-preserving placeholder block. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-canvas-subtle ${className}`} />;
}

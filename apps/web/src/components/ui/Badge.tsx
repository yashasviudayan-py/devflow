import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "brand" | "info" | "warning" | "danger" | "faint";

const toneClasses: Record<BadgeTone, { pill: string; dot: string }> = {
  neutral: { pill: "bg-canvas-subtle text-ink-secondary", dot: "bg-ink-faint" },
  brand: { pill: "bg-brand-50 text-brand-800", dot: "bg-brand-600" },
  info: { pill: "bg-sky-50 text-sky-800", dot: "bg-sky-500" },
  warning: { pill: "bg-amber-50 text-amber-800", dot: "bg-amber-500" },
  danger: { pill: "bg-red-50 text-red-800", dot: "bg-red-500" },
  faint: { pill: "bg-canvas-subtle text-ink-muted", dot: "bg-edge-strong" },
};

type BadgeProps = {
  tone?: BadgeTone;
  /** Adds a small tone-colored dot so state is not communicated by tint alone. */
  dot?: boolean;
  className?: string;
  children: ReactNode;
};

/** Compact status pill. One visual grammar for roles, statuses, and priorities. */
export function Badge({ tone = "neutral", dot = false, className = "", children }: BadgeProps) {
  const styles = toneClasses[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${styles.pill} ${className}`}
    >
      {dot ? <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} /> : null}
      {children}
    </span>
  );
}

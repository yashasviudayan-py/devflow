import type { ReactNode } from "react";

type PageHeaderProps = {
  /** Small contextual line above the title (kept quiet, not uppercase). */
  eyebrow?: ReactNode;
  title: string;
  description?: ReactNode;
  /** Row of badges rendered directly beneath the title. */
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/** The one place a screen uses display type. Title left, actions right. */
export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <header
      className={`flex flex-col gap-4 border-b border-edge-subtle pb-6 sm:flex-row sm:items-start sm:justify-between ${className}`}
    >
      <div className="min-w-0">
        {eyebrow ? <div className="mb-1 text-sm text-ink-muted">{eyebrow}</div> : null}
        <h1 className="break-words text-display text-ink">{title}</h1>
        {meta ? <div className="mt-2.5 flex flex-wrap items-center gap-2">{meta}</div> : null}
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:mt-1">{actions}</div>
      ) : null}
    </header>
  );
}

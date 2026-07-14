import type { ReactNode } from "react";

type CardProps = {
  className?: string;
  children: ReactNode;
};

/** Quiet content surface: white, hairline border, no shadow. */
export function Card({ className = "", children }: CardProps) {
  return (
    <div className={`rounded-card border border-edge-subtle bg-surface ${className}`}>
      {children}
    </div>
  );
}

type SectionHeaderProps = {
  title: string;
  /** Optional count shown next to the title, e.g. number of members. */
  count?: number;
  actions?: ReactNode;
  className?: string;
};

/** Heading row for a page section: title left, actions right. */
export function SectionHeader({ title, count, actions, className = "" }: SectionHeaderProps) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <h2 className="flex items-baseline gap-2 text-headline text-ink">
        {title}
        {typeof count === "number" ? (
          <span className="text-sm font-normal tabular-nums text-ink-muted">{count}</span>
        ) : null}
      </h2>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

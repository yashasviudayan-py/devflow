import Link from "next/link";

const sizes = {
  sm: { box: "h-6 w-6 rounded-[7px]", bars: "gap-[3px] px-[6px] py-[6px]", text: "text-sm" },
  md: { box: "h-7 w-7 rounded-lg", bars: "gap-1 px-[7px] py-[7px]", text: "text-[15px]" },
  lg: { box: "h-9 w-9 rounded-[10px]", bars: "gap-[5px] px-[9px] py-[9px]", text: "text-lg" },
} as const;

type BrandMarkProps = {
  size?: keyof typeof sizes;
  /** Where the mark links to; omit to render it as a plain (non-link) mark. */
  href?: string;
  className?: string;
};

/**
 * The DevFlow identity: an emerald tile holding two offset bars — a miniature
 * kanban board mid-flow — beside the wordmark.
 */
export function BrandMark({ size = "md", href, className = "" }: BrandMarkProps) {
  const s = sizes[size];

  const mark = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span aria-hidden className={`flex items-stretch bg-brand-700 ${s.box} ${s.bars}`}>
        <span className="mt-0 w-1/2 rounded-full bg-white/90" style={{ marginBottom: "22%" }} />
        <span className="w-1/2 rounded-full bg-white/60" style={{ marginTop: "22%" }} />
      </span>
      <span className={`font-semibold tracking-tight text-ink ${s.text}`}>DevFlow</span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="focus-ring inline-flex rounded-lg" aria-label="DevFlow home">
        {mark}
      </Link>
    );
  }

  return mark;
}

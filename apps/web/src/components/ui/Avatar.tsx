const palettes = [
  "bg-brand-100 text-brand-800",
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800",
  "bg-violet-100 text-violet-800",
  "bg-rose-100 text-rose-800",
] as const;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

// Deterministic: the same name always gets the same tint.
function paletteFor(name: string): (typeof palettes)[number] {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return palettes[Math.abs(hash) % palettes.length];
}

const sizes = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
} as const;

type AvatarProps = {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
};

/** Initials avatar — the app has no profile images, so this is the identity mark. */
export function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold ${sizes[size]} ${paletteFor(name)} ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
}

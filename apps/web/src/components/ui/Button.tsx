import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "@/components/ui/Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "tint" | "destructive";
export type ButtonSize = "sm" | "md";

const base =
  "focus-ring inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900",
  secondary:
    "border border-edge bg-surface text-ink-secondary shadow-[0_1px_1px_rgb(12_20_15/0.03)] hover:bg-surface-hover hover:text-ink active:bg-canvas-subtle",
  ghost: "text-ink-secondary hover:bg-canvas-subtle hover:text-ink active:bg-edge-subtle",
  tint: "text-brand-700 hover:bg-brand-50 active:bg-brand-100",
  destructive:
    "border border-red-200 bg-surface text-red-700 hover:border-red-300 hover:bg-red-50 active:bg-red-100",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 rounded-lg px-3 text-[13px]",
  md: "h-9 rounded-field px-3.5 text-sm",
};

/**
 * Composes the shared button classes. Exported separately so `next/link`
 * anchors can look identical to buttons without nesting interactive elements.
 */
export function buttonClasses(
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
  className = "",
): string {
  return `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables the button while a request is in flight. */
  isLoading?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "secondary",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={buttonClasses(variant, size, className)}
      {...rest}
    >
      {isLoading ? <Spinner className="h-3.5 w-3.5" /> : null}
      {children}
    </button>
  );
}

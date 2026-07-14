"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { BrandMark } from "@/components/ui/BrandMark";
import { Button, buttonClasses } from "@/components/ui/Button";

/**
 * Route-segment error boundary. Next.js renders this when a Client Component in
 * the app tree throws during render. It keeps the rest of the app shell intact
 * and gives the user a way to recover (retry or go home) instead of a blank
 * page. The thrown error is logged to the console for local debugging; it is
 * never shown verbatim to the user.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 text-ink">
      <div className="w-full max-w-md rounded-modal border border-edge-subtle bg-surface p-8 text-center shadow-raised">
        <div className="flex justify-center">
          <BrandMark href="/" />
        </div>
        <span className="mx-auto mt-6 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <AlertTriangle aria-hidden className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <h1 className="mt-4 text-headline text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          An unexpected error occurred while loading this page. You can try again, or head back to
          your dashboard.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="primary" onClick={reset}>
            Try again
          </Button>
          <Link href="/dashboard" className={buttonClasses("secondary")}>
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

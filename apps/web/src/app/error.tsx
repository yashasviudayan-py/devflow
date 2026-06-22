"use client";

import Link from "next/link";
import { useEffect } from "react";

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
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 text-neutral-950">
      <div className="w-full max-w-md rounded-md border border-neutral-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">DevFlow</p>
        <h1 className="mt-3 text-2xl font-semibold text-neutral-950">Something went wrong</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          An unexpected error occurred while loading this page. You can try again, or head back to
          your dashboard.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

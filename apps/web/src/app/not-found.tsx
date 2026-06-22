import Link from "next/link";

/**
 * App-wide 404 page, shown for unmatched routes and any `notFound()` call. Kept
 * visually consistent with the error boundary so missing resources feel handled
 * rather than broken.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 text-neutral-950">
      <div className="w-full max-w-md rounded-md border border-neutral-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">DevFlow</p>
        <h1 className="mt-3 text-2xl font-semibold text-neutral-950">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          The page you are looking for does not exist, or you do not have access to it.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/dashboard"
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

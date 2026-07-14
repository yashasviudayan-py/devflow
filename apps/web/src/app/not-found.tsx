import { Compass } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/ui/BrandMark";
import { buttonClasses } from "@/components/ui/Button";

/**
 * App-wide 404 page, shown for unmatched routes and any `notFound()` call. Kept
 * visually consistent with the error boundary so missing resources feel handled
 * rather than broken.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 text-ink">
      <div className="w-full max-w-md rounded-modal border border-edge-subtle bg-surface p-8 text-center shadow-raised">
        <div className="flex justify-center">
          <BrandMark href="/" />
        </div>
        <span className="mx-auto mt-6 flex h-11 w-11 items-center justify-center rounded-xl bg-canvas-subtle text-ink-muted">
          <Compass aria-hidden className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <h1 className="mt-4 text-headline text-ink">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          The page you are looking for does not exist, or you do not have access to it.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/dashboard" className={buttonClasses("primary")}>
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client";

import { Bell, ChevronRight, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { NotificationBell } from "@/components/NotificationBell";
import { AmbientLeaves, SidebarScene } from "@/components/decor/WindScene";
import { Avatar } from "@/components/ui/Avatar";
import { BrandMark } from "@/components/ui/BrandMark";
import { Spinner } from "@/components/ui/Spinner";
import { logout, type AuthUser } from "@/lib/api";
import { navigationItems } from "@/lib/navigation";

export type Crumb = {
  label: string;
  href?: string;
};

const navIcons: Record<string, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  "/dashboard": LayoutDashboard,
  "/notifications": Bell,
};

function NavLinks({ pathname, className = "" }: { pathname: string; className?: string }) {
  return (
    <nav aria-label="Primary" className={className}>
      <ul className="flex flex-col gap-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = navIcons[item.href];

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`focus-ring flex items-center gap-2.5 rounded-field px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-50 text-brand-800"
                    : "text-ink-secondary hover:bg-canvas-subtle hover:text-ink"
                }`}
              >
                {Icon ? (
                  <Icon
                    aria-hidden
                    className={`h-[18px] w-[18px] ${isActive ? "text-brand-700" : "text-ink-muted"}`}
                    strokeWidth={1.75}
                  />
                ) : null}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type AccountBlockProps = {
  user: AuthUser;
  isSigningOut: boolean;
  signOutError: string | null;
  onSignOut: () => void;
};

function AccountBlock({ user, isSigningOut, signOutError, onSignOut }: AccountBlockProps) {
  return (
    <div className="border-t border-edge-subtle pt-4">
      <div className="flex items-center gap-2.5 px-1">
        <Avatar name={user.name} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{user.name}</p>
          <p className="truncate text-xs text-ink-muted">{user.email}</p>
        </div>
      </div>
      {signOutError ? <p className="mt-2 px-1 text-xs text-red-600">{signOutError}</p> : null}
      <button
        type="button"
        onClick={onSignOut}
        disabled={isSigningOut}
        className="focus-ring mt-3 flex w-full items-center gap-2.5 rounded-field px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-canvas-subtle hover:text-ink disabled:cursor-not-allowed disabled:opacity-55"
      >
        {isSigningOut ? (
          <Spinner className="h-[18px] w-[18px]" />
        ) : (
          <LogOut aria-hidden className="h-[18px] w-[18px] text-ink-muted" strokeWidth={1.75} />
        )}
        {isSigningOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}

function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 ? (
                <ChevronRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
              ) : null}
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="focus-ring max-w-[14rem] truncate rounded px-0.5 font-medium text-ink-muted transition-colors hover:text-ink"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="max-w-[16rem] truncate px-0.5 font-medium text-ink-secondary"
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

type AppFrameProps = {
  user: AuthUser;
  /** Trail shown above the page content; the last crumb is the current page. */
  breadcrumbs?: Crumb[];
  /** "wide" removes the reading-width cap (used by the Kanban board). */
  width?: "default" | "wide";
  children: ReactNode;
};

/**
 * The authenticated application shell: fixed white sidebar with primary
 * navigation and the account block on desktop, a sticky header with a
 * disclosure menu on mobile, and a breadcrumb + notifications row above the
 * page content. Purely presentational apart from sign-out, which calls the
 * existing logout endpoint and redirects to /login.
 */
export function AppFrame({ user, breadcrumbs, width = "default", children }: AppFrameProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  // Close the mobile menu when navigation happens or Escape is pressed.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  async function handleSignOut() {
    setIsSigningOut(true);
    setSignOutError(null);

    try {
      await logout();
      router.replace("/login");
    } catch {
      setSignOutError("Sign out failed. Please try again.");
      setIsSigningOut(false);
    }
  }

  const contentWidth = width === "wide" ? "max-w-[1400px]" : "max-w-4xl";

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[250px] flex-col border-r border-edge-subtle bg-surface px-4 py-5 lg:flex">
        <div className="px-1">
          <BrandMark href="/dashboard" />
        </div>
        <NavLinks pathname={pathname} className="mt-8 flex-1" />
        {/* The tree and cat rest on the account block's top rule. */}
        <SidebarScene />
        <AccountBlock
          user={user}
          isSigningOut={isSigningOut}
          signOutError={signOutError}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Mobile header + disclosure menu */}
      <header className="sticky top-0 z-30 border-b border-edge-subtle bg-surface lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="focus-ring -ml-1 inline-flex h-9 w-9 items-center justify-center rounded-field text-ink-secondary transition-colors hover:bg-canvas-subtle hover:text-ink"
          >
            {isMenuOpen ? (
              <X aria-hidden className="h-5 w-5" strokeWidth={1.75} />
            ) : (
              <Menu aria-hidden className="h-5 w-5" strokeWidth={1.75} />
            )}
          </button>
          <BrandMark href="/dashboard" size="sm" />
          <NotificationBell />
        </div>
        {isMenuOpen ? (
          <div id="mobile-navigation" className="border-t border-edge-subtle px-4 py-4 shadow-menu">
            <NavLinks pathname={pathname} />
            <div className="mt-4">
              <AccountBlock
                user={user}
                isSigningOut={isSigningOut}
                signOutError={signOutError}
                onSignOut={handleSignOut}
              />
            </div>
          </div>
        ) : null}
      </header>

      {/* Content column. `isolate` keeps the ambient leaves (-z-10) behind the
          page content but above the canvas background. */}
      <div className="isolate lg:pl-[250px]">
        <AmbientLeaves className="fixed inset-y-0 left-0 right-0 -z-10 lg:left-[250px]" />
        <div className={`mx-auto w-full px-4 py-6 sm:px-6 lg:px-10 lg:py-8 ${contentWidth}`}>
          <div className="mb-6 flex items-center justify-between gap-4">
            {breadcrumbs && breadcrumbs.length > 0 ? <Breadcrumbs crumbs={breadcrumbs} /> : <div />}
            <div className="hidden lg:block">
              <NotificationBell />
            </div>
          </div>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}

/**
 * Full-page loading treatment shown while the auth guard resolves the current
 * user, before the shell can render.
 */
export function FullPageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
      <BrandMark size="lg" />
      <p className="flex items-center gap-2 text-sm text-ink-muted">
        <Spinner className="h-4 w-4" />
        {label}
      </p>
    </main>
  );
}

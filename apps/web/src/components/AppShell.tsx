import { Activity, Columns3, Users } from "lucide-react";
import Link from "next/link";
import { AmbientLeaves, WindScene } from "@/components/decor/WindScene";
import { BrandMark } from "@/components/ui/BrandMark";
import { buttonClasses } from "@/components/ui/Button";

const features = [
  {
    icon: Users,
    title: "Organizations & roles",
    description: "Group your team with owner, admin, member, and viewer permissions.",
  },
  {
    icon: Columns3,
    title: "Kanban board",
    description: "Move tasks through To do, In progress, In review, and Done.",
  },
  {
    icon: Activity,
    title: "Activity & notifications",
    description: "Follow every change with activity timelines and unread alerts.",
  },
] as const;

// A static, decorative miniature of the real board — the app's four statuses
// and priority badges, not an abstract illustration. Cards stagger in on load;
// "Ship login flow" arrives in Done last (see .landing-card-arrive).
const previewColumns = [
  {
    label: "To do",
    cards: [
      {
        title: "Draft release notes",
        badge: "Low",
        badgeClass: "bg-canvas-subtle text-ink-secondary",
      },
      { title: "Update onboarding doc", badge: "Medium", badgeClass: "bg-sky-50 text-sky-800" },
    ],
  },
  {
    label: "In progress",
    cards: [
      { title: "API error audit", badge: "High", badgeClass: "bg-amber-50 text-amber-800" },
      { title: "Refactor auth middleware", badge: "Medium", badgeClass: "bg-sky-50 text-sky-800" },
    ],
  },
  {
    label: "In review",
    cards: [
      { title: "Dashboard empty states", badge: "Medium", badgeClass: "bg-sky-50 text-sky-800" },
    ],
  },
  {
    label: "Done",
    cards: [
      { title: "Fix flaky CI pipeline", badge: "Done", badgeClass: "bg-brand-50 text-brand-800" },
    ],
  },
] as const;

const teamAvatars = [
  { initials: "AK", className: "bg-brand-100 text-brand-800" },
  { initials: "RS", className: "bg-sky-100 text-sky-800" },
  { initials: "MT", className: "bg-amber-100 text-amber-800" },
] as const;

/**
 * Public home page: a restrained product introduction. The authenticated
 * experience lives behind /dashboard; this page just states what DevFlow is
 * and routes people to sign up or log in.
 */
export function AppShell() {
  let cardIndex = 0;

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-6">
        <header className="flex items-center justify-between py-6">
          <BrandMark href="/" />
          <nav aria-label="Account" className="flex items-center gap-2">
            <Link href="/login" className={buttonClasses("ghost", "sm")}>
              Log in
            </Link>
            <Link href="/signup" className={buttonClasses("primary", "sm")}>
              Get started
            </Link>
          </nav>
        </header>

        <section className="relative flex flex-col items-center pb-20 pt-14 text-center sm:pt-20">
          <AmbientLeaves />
          <h1 className="landing-rise max-w-2xl text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Work, moving <span className="text-brand-700">forward.</span>
          </h1>
          <p
            className="landing-rise mt-5 max-w-xl text-base leading-7 text-ink-muted"
            style={{ animationDelay: "0.08s" }}
          >
            One calm workspace for your team&apos;s organizations, projects, and tasks — with a
            board that shows exactly where everything stands.
          </p>
          <div
            className="landing-rise mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "0.16s" }}
          >
            <Link href="/signup" className={buttonClasses("primary")}>
              Create your account
            </Link>
            <Link href="/login" className={buttonClasses("secondary")}>
              Log in
            </Link>
          </div>

          {/* Product preview: the board, framed as a browser window. */}
          <div
            aria-hidden
            className="landing-rise mt-16 w-full overflow-hidden rounded-modal border border-edge-subtle bg-surface shadow-raised"
            style={{ animationDelay: "0.24s" }}
          >
            <div className="relative flex items-center border-b border-edge-subtle px-4 py-2.5">
              <span className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-edge" />
                <span className="h-2.5 w-2.5 rounded-full bg-edge" />
                <span className="h-2.5 w-2.5 rounded-full bg-edge" />
              </span>
              <span className="absolute left-1/2 hidden -translate-x-1/2 rounded-full bg-canvas-subtle px-3 py-1 font-mono text-[11px] text-ink-muted sm:block">
                devflow.app/projects/mobile-launch/board
              </span>
            </div>

            <div className="flex items-center justify-between px-4 pb-1 pt-4 sm:px-5">
              <p className="text-sm font-semibold text-ink">Mobile app launch</p>
              <span className="flex -space-x-1.5">
                {teamAvatars.map((avatar) => (
                  <span
                    key={avatar.initials}
                    className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[9px] font-semibold ring-2 ring-surface ${avatar.className}`}
                  >
                    {avatar.initials}
                  </span>
                ))}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-5">
              {previewColumns.map((column) => (
                <div key={column.label} className="text-left">
                  <p className="flex items-baseline justify-between px-1 pb-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
                    {column.label}
                    <span className="text-ink-faint">
                      {column.label === "Done" ? column.cards.length + 1 : column.cards.length}
                    </span>
                  </p>
                  <div className="flex flex-col gap-2">
                    {column.cards.map((card) => (
                      <div
                        key={card.title}
                        className="landing-rise rounded-[10px] border border-edge-subtle bg-canvas-subtle p-3"
                        style={{ animationDelay: `${0.45 + cardIndex++ * 0.09}s` }}
                      >
                        <p className="text-[13px] font-medium leading-4 text-ink">{card.title}</p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${card.badgeClass}`}
                        >
                          {card.badge}
                        </span>
                      </div>
                    ))}
                    {column.label === "Done" && (
                      <div className="landing-card-arrive rounded-[10px] border border-edge-subtle bg-canvas-subtle p-3">
                        <p className="flex items-center gap-1.5 text-[13px] font-medium leading-4 text-ink">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3.5 w-3.5 shrink-0 text-brand-600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M4.5 12.5l5 5 10-11" pathLength={24} className="landing-check" />
                          </svg>
                          Ship login flow
                        </p>
                        <span className="mt-2 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-800">
                          Done
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-10 border-t border-edge-subtle py-14 sm:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title}>
              <feature.icon aria-hidden className="h-5 w-5 text-brand-700" strokeWidth={1.75} />
              <h2 className="mt-3 text-title text-ink">{feature.title}</h2>
              <p className="mt-1.5 text-sm leading-6 text-ink-muted">{feature.description}</p>
            </div>
          ))}
        </section>

        {/* The wind scene stands on the footer rule — the divider is its ground. */}
        <WindScene />

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-edge-subtle py-8 text-sm text-ink-muted sm:flex-row">
          <BrandMark size="sm" />
          <p>Project management for teams that ship.</p>
        </footer>
      </div>
    </main>
  );
}

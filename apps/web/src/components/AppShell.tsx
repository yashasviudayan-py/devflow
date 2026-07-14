import { Activity, Columns3, Users } from "lucide-react";
import Link from "next/link";
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

// A static, decorative miniature of the board — real UI grammar (columns,
// status dots, cards) rather than an abstract illustration.
const previewColumns = [
  {
    label: "To do",
    dot: "bg-ink-faint",
    cards: [
      { title: "Draft release notes", badge: "Low", badgeClass: "bg-canvas-subtle text-ink-secondary" },
      { title: "Update onboarding doc", badge: "Medium", badgeClass: "bg-sky-50 text-sky-800" },
    ],
  },
  {
    label: "In progress",
    dot: "bg-sky-500",
    cards: [{ title: "API error audit", badge: "High", badgeClass: "bg-amber-50 text-amber-800" }],
  },
  {
    label: "Done",
    dot: "bg-brand-600",
    cards: [{ title: "Ship login flow", badge: "Done", badgeClass: "bg-brand-50 text-brand-800" }],
  },
] as const;

/**
 * Public home page: a restrained product introduction. The authenticated
 * experience lives behind /dashboard; this page just states what DevFlow is
 * and routes people to sign up or log in.
 */
export function AppShell() {
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

        <section className="flex flex-col items-center pb-16 pt-14 text-center sm:pt-20">
          <h1 className="max-w-2xl text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Work, moving <span className="text-brand-700">forward.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-ink-muted">
            DevFlow keeps your organizations, projects, and tasks in one calm workspace — with a
            board that shows exactly where everything stands.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className={buttonClasses("primary")}>
              Create your account
            </Link>
            <Link href="/login" className={buttonClasses("secondary")}>
              Log in
            </Link>
          </div>

          {/* Product preview */}
          <div
            aria-hidden
            className="mt-14 w-full max-w-3xl rounded-modal border border-edge-subtle bg-surface p-4 shadow-raised sm:p-6"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {previewColumns.map((column) => (
                <div
                  key={column.label}
                  className="rounded-card border border-edge-subtle bg-canvas-subtle p-3 text-left"
                >
                  <p className="flex items-center gap-2 px-1 pb-2.5 text-xs font-semibold text-ink-secondary">
                    <span className={`h-1.5 w-1.5 rounded-full ${column.dot}`} />
                    {column.label}
                  </p>
                  <div className="flex flex-col gap-2">
                    {column.cards.map((card) => (
                      <div
                        key={card.title}
                        className="rounded-[10px] border border-edge-subtle bg-surface p-3"
                      >
                        <p className="text-[13px] font-semibold leading-4 text-ink">{card.title}</p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${card.badgeClass}`}
                        >
                          {card.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 border-t border-edge-subtle py-14 sm:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-card border border-edge-subtle bg-surface p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand-50 text-brand-700">
                <feature.icon aria-hidden className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h2 className="mt-4 text-title text-ink">{feature.title}</h2>
              <p className="mt-1.5 text-sm leading-6 text-ink-muted">{feature.description}</p>
            </div>
          ))}
        </section>

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-edge-subtle py-8 text-sm text-ink-muted sm:flex-row">
          <BrandMark size="sm" />
          <p>Project management for teams that ship.</p>
        </footer>
      </div>
    </main>
  );
}

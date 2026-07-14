import { ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/states";
import type { OrganizationWithRole } from "@/lib/api";

export function EmptyOrganizationsState() {
  return (
    <EmptyState
      icon={Building2}
      title="No organizations yet"
      description="Organizations group your team, projects, and tasks. Create your first one to get started."
      action={
        <Link href="/organizations/new" className={buttonClasses("primary")}>
          Create organization
        </Link>
      }
    />
  );
}

type OrganizationCardProps = {
  organization: OrganizationWithRole;
  isActive: boolean;
  onSelectActive: (organizationId: string) => void;
};

export function OrganizationCard({
  organization,
  isActive,
  onSelectActive,
}: OrganizationCardProps) {
  return (
    <li
      className={`flex flex-col gap-3 rounded-card border bg-surface p-5 transition-shadow sm:flex-row sm:items-center sm:justify-between ${
        isActive ? "border-brand-300 ring-1 ring-brand-200" : "border-edge-subtle hover:shadow-raised"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-50 text-brand-700"
        >
          <Building2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/organizations/${organization.id}`}
              className="focus-ring truncate rounded text-title text-ink hover:text-brand-800"
            >
              {organization.name}
            </Link>
            {isActive ? (
              <Badge tone="brand" dot>
                Active
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-sm text-ink-muted">
            {organization.slug} · {organization.role.toLowerCase()}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-12 sm:pl-0">
        {isActive ? null : (
          <button
            type="button"
            onClick={() => onSelectActive(organization.id)}
            className={buttonClasses("secondary", "sm")}
          >
            Set active
          </button>
        )}
        <Link
          href={`/organizations/${organization.id}`}
          className={buttonClasses("tint", "sm")}
        >
          View
          <ArrowRight aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Link>
      </div>
    </li>
  );
}

type OrganizationListProps = {
  organizations: OrganizationWithRole[];
  activeOrganizationId: string | null;
  onSelectActive: (organizationId: string) => void;
};

export function OrganizationList({
  organizations,
  activeOrganizationId,
  onSelectActive,
}: OrganizationListProps) {
  if (organizations.length === 0) {
    return <EmptyOrganizationsState />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {organizations.map((organization) => (
        <OrganizationCard
          key={organization.id}
          organization={organization}
          isActive={organization.id === activeOrganizationId}
          onSelectActive={onSelectActive}
        />
      ))}
    </ul>
  );
}

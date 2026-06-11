import Link from "next/link";
import type { OrganizationWithRole } from "@/lib/api";

export function EmptyOrganizationsState() {
  return (
    <div className="rounded-md border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
      <h3 className="text-base font-semibold text-neutral-950">No organizations yet</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
        Organizations group your team, projects, and tasks. Create your first one to get started.
      </p>
      <Link
        href="/organizations/new"
        className="mt-6 inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
      >
        Create organization
      </Link>
    </div>
  );
}

type OrganizationCardProps = {
  organization: OrganizationWithRole;
  isActive: boolean;
  onSelectActive: (organizationId: string) => void;
};

export function OrganizationCard({ organization, isActive, onSelectActive }: OrganizationCardProps) {
  return (
    <li
      className={`flex flex-col gap-3 rounded-md border bg-white p-4 sm:flex-row sm:items-center sm:justify-between ${
        isActive ? "border-emerald-600 ring-1 ring-emerald-600" : "border-neutral-200"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/organizations/${organization.id}`}
            className="truncate text-base font-semibold text-neutral-950 hover:underline"
          >
            {organization.name}
          </Link>
          {isActive ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
              Active
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          {organization.slug} · {organization.role.toLowerCase()}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isActive ? null : (
          <button
            type="button"
            onClick={() => onSelectActive(organization.id)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            Set active
          </button>
        )}
        <Link
          href={`/organizations/${organization.id}`}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
        >
          View
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

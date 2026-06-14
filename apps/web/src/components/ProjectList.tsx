import Link from "next/link";
import type { Project } from "@/lib/api";

type EmptyProjectsStateProps = {
  organizationId: string;
  // Only members who can create projects (OWNER/ADMIN/MEMBER) see the CTA.
  canCreate: boolean;
};

export function EmptyProjectsState({ organizationId, canCreate }: EmptyProjectsStateProps) {
  return (
    <div className="rounded-md border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
      <h3 className="text-base font-semibold text-neutral-950">No projects yet</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
        Projects organize your team&apos;s work. Create your first one to get started.
      </p>
      {canCreate ? (
        <Link
          href={`/organizations/${organizationId}/projects/new`}
          className="mt-6 inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
        >
          Create project
        </Link>
      ) : null}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <li className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link
          href={`/projects/${project.id}`}
          className="truncate text-base font-semibold text-neutral-950 hover:underline"
        >
          {project.name}
        </Link>
        {project.description ? (
          <p className="mt-1 truncate text-sm text-neutral-600">{project.description}</p>
        ) : (
          <p className="mt-1 text-sm italic text-neutral-400">No description</p>
        )}
        <p className="mt-1 text-xs text-neutral-500">Created {formatDate(project.createdAt)}</p>
      </div>

      <Link
        href={`/projects/${project.id}`}
        className="shrink-0 self-start rounded-md px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 sm:self-auto"
      >
        View
      </Link>
    </li>
  );
}

type ProjectListProps = {
  projects: Project[];
  organizationId: string;
  canCreate: boolean;
};

export function ProjectList({ projects, organizationId, canCreate }: ProjectListProps) {
  if (projects.length === 0) {
    return <EmptyProjectsState organizationId={organizationId} canCreate={canCreate} />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </ul>
  );
}

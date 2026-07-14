import { ArrowRight, FolderKanban } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/states";
import type { Project } from "@/lib/api";

type EmptyProjectsStateProps = {
  organizationId: string;
  // Only members who can create projects (OWNER/ADMIN/MEMBER) see the CTA.
  canCreate: boolean;
};

export function EmptyProjectsState({ organizationId, canCreate }: EmptyProjectsStateProps) {
  return (
    <EmptyState
      icon={FolderKanban}
      title="No projects yet"
      description="Projects organize your team's work. Create your first one to get started."
      action={
        canCreate ? (
          <Link
            href={`/organizations/${organizationId}/projects/new`}
            className={buttonClasses("primary")}
          >
            Create project
          </Link>
        ) : undefined
      }
    />
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
    <li className="flex flex-col gap-3 rounded-card border border-edge-subtle bg-surface p-5 transition-shadow hover:shadow-raised sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link
          href={`/projects/${project.id}`}
          className="focus-ring truncate rounded text-title text-ink hover:text-brand-800"
        >
          {project.name}
        </Link>
        {project.description ? (
          <p className="mt-1 truncate text-sm text-ink-secondary">{project.description}</p>
        ) : (
          <p className="mt-1 text-sm text-ink-faint">No description</p>
        )}
        <p className="mt-1.5 text-xs tabular-nums text-ink-muted">
          Created {formatDate(project.createdAt)}
        </p>
      </div>

      <Link
        href={`/projects/${project.id}`}
        className={`${buttonClasses("tint", "sm")} shrink-0 self-start sm:self-auto`}
      >
        View
        <ArrowRight aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
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

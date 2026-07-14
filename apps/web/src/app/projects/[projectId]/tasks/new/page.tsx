"use client";

import { SearchX } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthCard } from "@/components/AuthCard";
import { FullPageLoader } from "@/components/app/AppFrame";
import { CreateTaskForm } from "@/components/CreateTaskForm";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/states";
import {
  ApiError,
  getOrganizationMembers,
  getProject,
  type OrganizationMember,
  type Project,
} from "@/lib/api";
import { useRequireUser } from "@/lib/useRequireUser";

export default function NewTaskPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const user = useRequireUser();
  const [project, setProject] = useState<Project | null>(null);
  // Members populate the assignee dropdown. We resolve the organization from the
  // project, since the task endpoints don't expose an organization id directly.
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !projectId) {
      return;
    }

    let isActive = true;

    getProject(projectId)
      .then(async (loadedProject) => {
        const loadedMembers = await getOrganizationMembers(loadedProject.organizationId);
        return { loadedProject, loadedMembers };
      })
      .then(({ loadedProject, loadedMembers }) => {
        if (!isActive) {
          return;
        }

        setProject(loadedProject);
        setMembers(loadedMembers);
      })
      .catch((caught: unknown) => {
        if (!isActive) {
          return;
        }

        if (caught instanceof ApiError && caught.statusCode === 404) {
          setNotFound(true);
        } else {
          setError("Could not load this project. Please try again.");
        }
      });

    return () => {
      isActive = false;
    };
  }, [user, projectId]);

  if (!user) {
    return <FullPageLoader />;
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-md">
          <EmptyState
            variant="filtered"
            icon={SearchX}
            title="Project not found"
            description="This project does not exist or you do not have access to it."
            action={
              <Link href="/dashboard" className={buttonClasses("secondary")}>
                Back to dashboard
              </Link>
            }
          />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-md">
          <ErrorState message={error} />
        </div>
      </main>
    );
  }

  if (!project) {
    return <FullPageLoader label="Loading project…" />;
  }

  return (
    <AuthCard
      title="Create a task"
      description={`Add a task to ${project.name}.`}
      width="lg"
      footer={{
        prompt: "Changed your mind?",
        linkLabel: "Back to project",
        linkHref: `/projects/${project.id}`,
      }}
    >
      <CreateTaskForm projectId={project.id} members={members} />
    </AuthCard>
  );
}

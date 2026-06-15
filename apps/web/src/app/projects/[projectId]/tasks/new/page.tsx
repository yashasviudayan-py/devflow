"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthCard } from "@/components/AuthCard";
import { CreateTaskForm } from "@/components/CreateTaskForm";
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
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-500">Loading…</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-md rounded-md border border-neutral-200 bg-white px-6 py-12 text-center">
          <h1 className="text-lg font-semibold">Project not found</h1>
          <p className="mt-2 text-sm text-neutral-600">
            This project does not exist or you do not have access to it.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block text-sm font-medium text-emerald-700 hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-500">Loading project…</p>
      </main>
    );
  }

  return (
    <AuthCard
      title="Create a task"
      description={`Add a task to ${project.name}.`}
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

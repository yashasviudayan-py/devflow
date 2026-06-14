"use client";

import { useParams } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { CreateProjectForm } from "@/components/CreateProjectForm";
import { useRequireUser } from "@/lib/useRequireUser";

export default function NewProjectPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const user = useRequireUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-500">Loading…</p>
      </main>
    );
  }

  return (
    <AuthCard
      title="Create a project"
      description="Projects organize your team's work inside an organization."
      footer={{
        prompt: "Changed your mind?",
        linkLabel: "Back to organization",
        linkHref: `/organizations/${organizationId}`,
      }}
    >
      <CreateProjectForm organizationId={organizationId} />
    </AuthCard>
  );
}

"use client";

import { useParams } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { FullPageLoader } from "@/components/app/AppFrame";
import { CreateProjectForm } from "@/components/CreateProjectForm";
import { useRequireUser } from "@/lib/useRequireUser";

export default function NewProjectPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const user = useRequireUser();

  if (!user) {
    return <FullPageLoader />;
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

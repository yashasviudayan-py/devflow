"use client";

import { AuthCard } from "@/components/AuthCard";
import { FullPageLoader } from "@/components/app/AppFrame";
import { CreateOrganizationForm } from "@/components/CreateOrganizationForm";
import { useRequireUser } from "@/lib/useRequireUser";

export default function NewOrganizationPage() {
  const user = useRequireUser();

  if (!user) {
    return <FullPageLoader />;
  }

  return (
    <AuthCard
      title="Create an organization"
      description="Organizations group your team, projects, and tasks."
      footer={{
        prompt: "Changed your mind?",
        linkLabel: "Back to dashboard",
        linkHref: "/dashboard",
      }}
    >
      <CreateOrganizationForm />
    </AuthCard>
  );
}

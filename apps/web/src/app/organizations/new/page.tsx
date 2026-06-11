"use client";

import { AuthCard } from "@/components/AuthCard";
import { CreateOrganizationForm } from "@/components/CreateOrganizationForm";
import { useRequireUser } from "@/lib/useRequireUser";

export default function NewOrganizationPage() {
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

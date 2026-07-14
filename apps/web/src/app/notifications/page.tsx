"use client";

import { AppFrame, FullPageLoader } from "@/components/app/AppFrame";
import { NotificationList } from "@/components/NotificationList";
import { PageHeader } from "@/components/ui/PageHeader";
import { useRequireUser } from "@/lib/useRequireUser";

export default function NotificationsPage() {
  // Reuses the app-wide auth guard: redirects to /login when there is no session.
  const user = useRequireUser();

  if (!user) {
    return <FullPageLoader />;
  }

  return (
    <AppFrame
      user={user}
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Notifications" }]}
    >
      <PageHeader
        title="Notifications"
        description="Updates about tasks you're assigned to or involved in."
      />

      <NotificationList />
    </AppFrame>
  );
}

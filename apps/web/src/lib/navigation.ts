// Primary navigation for the authenticated app shell. Only routes that exist
// are listed — deeper pages (organizations, projects, tasks) are reached
// through the dashboard hierarchy and breadcrumbs rather than global nav.
export const navigationItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Notifications", href: "/notifications" },
] as const;

export type NavigationItem = (typeof navigationItems)[number];

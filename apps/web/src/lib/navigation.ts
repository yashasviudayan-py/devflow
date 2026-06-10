export const navigationItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projects", href: "/projects" },
  { label: "Tasks", href: "/tasks" },
  { label: "Settings", href: "/settings" },
] as const;

export type NavigationItem = (typeof navigationItems)[number];

import { describe, expect, it } from "vitest";
import { navigationItems } from "./navigation";

describe("navigationItems", () => {
  it("lists the shell's product areas", () => {
    expect(navigationItems.map((item) => item.label)).toEqual(["Dashboard", "Notifications"]);
  });

  it("only links to routes that exist", () => {
    // Keep in sync with src/app — a nav item pointing at a missing route is a
    // dead link on every authenticated screen.
    const existingRoutes = ["/dashboard", "/notifications"];
    for (const item of navigationItems) {
      expect(existingRoutes).toContain(item.href);
    }
  });
});

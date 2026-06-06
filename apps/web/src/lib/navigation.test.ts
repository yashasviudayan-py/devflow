import { describe, expect, it } from "vitest";
import { navigationItems } from "./navigation";

describe("navigationItems", () => {
  it("includes the initial product areas", () => {
    expect(navigationItems.map((item) => item.label)).toEqual([
      "Dashboard",
      "Projects",
      "Tasks",
      "Settings",
    ]);
  });
});

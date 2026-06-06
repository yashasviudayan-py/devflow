import { describe, expect, it } from "vitest";
import { createProjectSchema } from "./schemas.js";

describe("createProjectSchema", () => {
  it("accepts a valid project payload", () => {
    const parsed = createProjectSchema.parse({
      name: "Website redesign",
      description: "Refresh the public marketing site.",
    });

    expect(parsed.name).toBe("Website redesign");
  });

  it("rejects a project name that is too short", () => {
    expect(() => createProjectSchema.parse({ name: "A" })).toThrow();
  });
});

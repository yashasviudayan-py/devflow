import { describe, expect, it } from "vitest";
import { normalizeSearchQuery, parseSortParams } from "./query.js";

describe("normalizeSearchQuery", () => {
  it("returns a trimmed term for a real query", () => {
    expect(normalizeSearchQuery("  hello  ")).toBe("hello");
  });

  it("returns undefined for an undefined query", () => {
    expect(normalizeSearchQuery(undefined)).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(normalizeSearchQuery("")).toBeUndefined();
  });

  it("returns undefined for whitespace only, so ?q=%20 does not match every row", () => {
    expect(normalizeSearchQuery("   ")).toBeUndefined();
  });
});

describe("parseSortParams", () => {
  it("falls back to the default field and order when neither is supplied", () => {
    expect(parseSortParams({}, { field: "createdAt", order: "desc" })).toEqual({
      field: "createdAt",
      order: "desc",
    });
  });

  it("defaults the order to asc when no default order is given", () => {
    expect(parseSortParams({}, { field: "name" })).toEqual({
      field: "name",
      order: "asc",
    });
  });

  it("honors an explicit field and order over the defaults", () => {
    expect(
      parseSortParams({ sortBy: "title", sortOrder: "desc" }, { field: "createdAt", order: "asc" }),
    ).toEqual({ field: "title", order: "desc" });
  });
});

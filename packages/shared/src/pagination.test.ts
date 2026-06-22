import { describe, expect, it } from "vitest";
import { MAX_PAGE_SIZE, paginationQuerySchema } from "./pagination.js";

describe("paginationQuerySchema", () => {
  it("accepts an empty query (both params optional)", () => {
    expect(paginationQuerySchema.parse({})).toEqual({});
  });

  it("coerces a numeric string limit", () => {
    expect(paginationQuerySchema.parse({ limit: "25" })).toEqual({ limit: 25 });
  });

  it("rejects a limit above the maximum", () => {
    expect(paginationQuerySchema.safeParse({ limit: MAX_PAGE_SIZE + 1 }).success).toBe(false);
  });

  it("rejects a zero or negative limit", () => {
    expect(paginationQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ limit: -5 }).success).toBe(false);
  });

  it("rejects a non-integer limit", () => {
    expect(paginationQuerySchema.safeParse({ limit: 1.5 }).success).toBe(false);
  });

  it("trims a cursor and rejects an empty one", () => {
    expect(paginationQuerySchema.parse({ cursor: "  abc  " })).toEqual({ cursor: "abc" });
    expect(paginationQuerySchema.safeParse({ cursor: "   " }).success).toBe(false);
  });
});

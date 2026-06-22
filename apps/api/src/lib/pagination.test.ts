import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@devflow/shared";
import { describe, expect, it } from "vitest";
import { resolveLimit, toCursorArgs, toPage } from "./pagination.js";

// Pure cursor-pagination math. No database is touched, but this file lives in
// the API suite (which truncates between tests) for locality with the code.

describe("resolveLimit", () => {
  it("defaults to DEFAULT_PAGE_SIZE when no limit is given", () => {
    expect(resolveLimit({})).toBe(DEFAULT_PAGE_SIZE);
  });

  it("uses the requested limit when within bounds", () => {
    expect(resolveLimit({ limit: 5 })).toBe(5);
  });

  it("caps the limit at MAX_PAGE_SIZE", () => {
    expect(resolveLimit({ limit: MAX_PAGE_SIZE + 50 })).toBe(MAX_PAGE_SIZE);
  });
});

describe("toCursorArgs", () => {
  it("fetches one extra row and no cursor on the first page", () => {
    expect(toCursorArgs({ limit: 10 })).toEqual({ take: 11 });
  });

  it("skips the cursor row itself when a cursor is supplied", () => {
    expect(toCursorArgs({ limit: 10, cursor: "abc" })).toEqual({
      take: 11,
      skip: 1,
      cursor: { id: "abc" },
    });
  });

  it("applies the default page size to the extra-row count", () => {
    expect(toCursorArgs({})).toEqual({ take: DEFAULT_PAGE_SIZE + 1 });
  });
});

describe("toPage", () => {
  const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `id-${i}` }));

  it("returns a null nextCursor when fewer than limit+1 rows are returned", () => {
    const page = toPage(rows(3), { limit: 10 });

    expect(page.items).toHaveLength(3);
    expect(page.nextCursor).toBeNull();
  });

  it("returns a null nextCursor at exactly the limit (boundary)", () => {
    const page = toPage(rows(10), { limit: 10 });

    expect(page.items).toHaveLength(10);
    expect(page.nextCursor).toBeNull();
  });

  it("trims the extra row and sets nextCursor to the last kept id", () => {
    const page = toPage(rows(11), { limit: 10 });

    expect(page.items).toHaveLength(10);
    expect(page.items[page.items.length - 1].id).toBe("id-9");
    expect(page.nextCursor).toBe("id-9");
  });
});

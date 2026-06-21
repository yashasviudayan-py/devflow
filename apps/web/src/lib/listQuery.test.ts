import { taskStatuses } from "@devflow/shared";
import { describe, expect, it } from "vitest";
import {
  buildQueryString,
  DEFAULT_PAGE_SIZE,
  mergeSearchParams,
  parseEnumParam,
  parsePageSize,
  parseSortOrder,
} from "./listQuery";

describe("buildQueryString", () => {
  it("returns an empty string when nothing is set", () => {
    expect(buildQueryString({})).toBe("");
    expect(buildQueryString({ q: undefined, status: null, cursor: "" })).toBe("");
  });

  it("includes only the params that have a value", () => {
    expect(buildQueryString({ q: "bug", status: "TODO", priority: undefined })).toBe(
      "?q=bug&status=TODO",
    );
  });

  it("stringifies numbers and booleans", () => {
    expect(buildQueryString({ limit: 20, unassigned: true })).toBe("?limit=20&unassigned=true");
  });

  it("encodes special characters", () => {
    expect(buildQueryString({ q: "a b&c" })).toBe("?q=a+b%26c");
  });
});

describe("mergeSearchParams", () => {
  it("adds and updates keys", () => {
    const current = new URLSearchParams("q=old&page=2");
    expect(mergeSearchParams(current, { q: "new", sortBy: "name" })).toBe(
      "q=new&page=2&sortBy=name",
    );
  });

  it("deletes keys with empty/undefined/null values", () => {
    const current = new URLSearchParams("q=bug&status=TODO");
    expect(mergeSearchParams(current, { q: undefined, status: "" })).toBe("");
  });

  it("does not mutate the input params", () => {
    const current = new URLSearchParams("q=bug");
    mergeSearchParams(current, { q: "changed" });
    expect(current.get("q")).toBe("bug");
  });
});

describe("parseSortOrder", () => {
  it("accepts asc and desc only", () => {
    expect(parseSortOrder("asc")).toBe("asc");
    expect(parseSortOrder("desc")).toBe("desc");
  });

  it("rejects anything else", () => {
    expect(parseSortOrder("sideways")).toBeUndefined();
    expect(parseSortOrder(null)).toBeUndefined();
  });
});

describe("parseEnumParam", () => {
  it("returns the value when it is in the allow-list", () => {
    expect(parseEnumParam("IN_REVIEW", taskStatuses)).toBe("IN_REVIEW");
  });

  it("returns undefined for values outside the allow-list", () => {
    expect(parseEnumParam("NOPE", taskStatuses)).toBeUndefined();
    expect(parseEnumParam(null, taskStatuses)).toBeUndefined();
  });
});

describe("parsePageSize", () => {
  it("accepts the supported page sizes", () => {
    expect(parsePageSize("10")).toBe(10);
    expect(parsePageSize("20")).toBe(20);
    expect(parsePageSize("50")).toBe(50);
  });

  it("falls back to the default for unsupported or missing values", () => {
    expect(parsePageSize("25")).toBe(DEFAULT_PAGE_SIZE);
    expect(parsePageSize("0")).toBe(DEFAULT_PAGE_SIZE);
    expect(parsePageSize(null)).toBe(DEFAULT_PAGE_SIZE);
  });
});

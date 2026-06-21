import { projectSortFields, taskSortFields } from "@devflow/shared";

// Shared building blocks for the list (search/filter/sort/paginate) UIs.
//
// The DevFlow API uses **cursor pagination** (`limit` + `cursor` → `nextCursor`),
// not offset/`page`. So the UI cannot show a total count or total-pages number;
// instead it tracks a current page index client-side and pages forward/back with
// cursors. These helpers stay pure (no React) so they are easy to unit test.

export type SortOrder = "asc" | "desc";
export type ProjectSortField = (typeof projectSortFields)[number];
export type TaskSortField = (typeof taskSortFields)[number];

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

type QueryValue = string | number | boolean | undefined | null;

// A set of search-param updates to merge into the URL. An empty/undefined/null
// value removes the key (see `mergeSearchParams`).
export type QueryUpdates = Record<string, QueryValue>;

/**
 * Builds a `?a=1&b=2` query string from a plain object, omitting empty values
 * (`undefined`, `null`, or `""`). Returns `""` when nothing is set, so callers can
 * safely append it to a path. Values are stringified; booleans become `"true"`/
 * `"false"`. `URLSearchParams` handles encoding.
 */
export function buildQueryString(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

/**
 * Merges `updates` into the current URL search params and returns the resulting
 * query string (no leading `?`). An empty/`undefined`/`null` value deletes the
 * key, so toggling a filter off cleans up the URL. Pure, so it is unit tested.
 */
export function mergeSearchParams(
  current: URLSearchParams,
  updates: Record<string, QueryValue>,
): string {
  const next = new URLSearchParams(current.toString());

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === null || value === "") {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
  }

  return next.toString();
}

// --- Validated parsers: keep arbitrary URL text from leaking into typed state ---

export function parseSortOrder(value: string | null): SortOrder | undefined {
  return value === "asc" || value === "desc" ? value : undefined;
}

export function parseEnumParam<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | undefined {
  return value !== null && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

/** Coerces a `limit` query param to one of the allowed page sizes, else the default. */
export function parsePageSize(value: string | null): number {
  const parsed = Number(value);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
}

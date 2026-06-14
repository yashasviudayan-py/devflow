import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type Paginated,
  type PaginationQuery,
} from "@devflow/shared";

/**
 * Cursor pagination is built on top of a unique, monotonically-ordered column.
 * Every paginated query must `orderBy` a stable tiebreaker (we use `id`) and
 * fetch `take: limit + 1` rows so we can tell whether another page exists
 * without a second `count` query.
 */
export function resolveLimit(pagination: PaginationQuery): number {
  return Math.min(pagination.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
}

type CursorArgs = {
  take: number;
  skip?: number;
  cursor?: { id: string };
};

// Prisma `take`/`skip`/`cursor` args that fetch one extra row to detect a next page.
export function toCursorArgs(pagination: PaginationQuery): CursorArgs {
  const take = resolveLimit(pagination) + 1;

  if (pagination.cursor) {
    // `skip: 1` excludes the cursor row itself, which the client already has.
    return { take, skip: 1, cursor: { id: pagination.cursor } };
  }

  return { take };
}

/**
 * Slices the `limit + 1` rows returned by a cursor query into a page plus a
 * `nextCursor`. The cursor is the id of the last returned row, or `null` when
 * there are no further pages. `rows` must be ordered the same way the query was.
 */
export function toPage<T extends { id: string }>(
  rows: T[],
  pagination: PaginationQuery,
): Paginated<T> {
  const limit = resolveLimit(pagination);

  if (rows.length > limit) {
    const items = rows.slice(0, limit);
    return { items, nextCursor: items[items.length - 1].id };
  }

  return { items: rows, nextCursor: null };
}

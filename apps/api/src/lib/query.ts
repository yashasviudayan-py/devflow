import type { Prisma } from "@prisma/client";

type SortOrder = Prisma.SortOrder;

/**
 * Collapses an optional search string into a usable term or `undefined`. Callers
 * pass the result straight into a `contains` filter, so trimming here keeps a
 * stray-whitespace query (e.g. `?q=%20`) from matching every row.
 */
export function normalizeSearchQuery(q?: string): string | undefined {
  const trimmed = q?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Resolves a validated `(sortBy, sortOrder)` pair into a concrete field + order,
 * applying per-resource defaults when either is omitted.
 *
 * `sortBy` MUST already be validated against an allow-list (we use a Zod enum in
 * `@devflow/shared`) before it reaches here — that is what makes it safe to build
 * a Prisma `orderBy` from it without risking arbitrary-column injection.
 */
export function parseSortParams<TField extends string>(
  params: { sortBy?: TField; sortOrder?: SortOrder },
  defaults: { field: TField; order?: SortOrder },
): { field: TField; order: SortOrder } {
  return {
    field: params.sortBy ?? defaults.field,
    order: params.sortOrder ?? defaults.order ?? "asc",
  };
}

import { z } from "zod";

// Cursor pagination defaults shared by every list endpoint. The cursor is an
// opaque token (the id of the last row in the previous page); clients should
// treat it as opaque and pass it back verbatim.
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).optional(),
  cursor: z.string().trim().min(1).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// The standard list envelope: a named array (per resource) plus `nextCursor`,
// which is `null` once the final page has been returned.
export type Paginated<T> = {
  items: T[];
  nextCursor: string | null;
};

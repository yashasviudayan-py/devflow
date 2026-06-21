"use client";

import { useEffect, useState } from "react";

/**
 * Client-side cursor pagination state for the DevFlow list endpoints, which page
 * with an opaque `cursor` and return a `nextCursor` (no page numbers or totals).
 *
 * Because the API has no "previous cursor", we keep the cursor that started each
 * visited page in a stack so the user can page back. `cursors[i]` is the cursor
 * used to load page `i`; page 0 uses `undefined` (the first page).
 *
 * `resetKey` encodes the active search/filter/sort/limit. Whenever it changes we
 * jump back to page 1 — both because results change and because cursors from the
 * old query are meaningless against the new one. The page position itself is not
 * stored in the URL, so a refresh restarts at page 1 while filters (which live in
 * the URL) persist.
 */
export function useCursorPagination(resetKey: string) {
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setCursors([undefined]);
    setPageIndex(0);
  }, [resetKey]);

  function goNext(nextCursor: string | null) {
    if (!nextCursor) {
      return;
    }

    setCursors((current) => [...current.slice(0, pageIndex + 1), nextCursor]);
    setPageIndex((index) => index + 1);
  }

  function goPrev() {
    setPageIndex((index) => Math.max(0, index - 1));
  }

  return {
    cursor: cursors[pageIndex],
    pageIndex,
    hasPrev: pageIndex > 0,
    goNext,
    goPrev,
  };
}

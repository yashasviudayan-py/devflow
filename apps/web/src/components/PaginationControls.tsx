"use client";

import { PAGE_SIZE_OPTIONS } from "@/lib/listQuery";

type PaginationControlsProps = {
  // 0-based page index; we display it 1-based.
  pageIndex: number;
  hasPrev: boolean;
  hasNext: boolean;
  pageSize: number;
  isLoading?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPageSizeChange: (pageSize: number) => void;
};

const buttonClassName =
  "rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50";

const selectClassName =
  "rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-950 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";

/**
 * Prev/Next pagination for the cursor-paginated lists. The API returns no total
 * count, so we show the current page number only and disable Next at the end
 * (when there is no next cursor) and Prev on the first page.
 */
export function PaginationControls({
  pageIndex,
  hasPrev,
  hasNext,
  pageSize,
  isLoading = false,
  onPrev,
  onNext,
  onPageSizeChange,
}: PaginationControlsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <label className="flex items-center gap-2 text-sm text-neutral-600">
        Per page
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className={selectClassName}
          aria-label="Results per page"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-600" aria-live="polite">
          Page {pageIndex + 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev || isLoading}
            className={buttonClassName}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext || isLoading}
            className={buttonClassName}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

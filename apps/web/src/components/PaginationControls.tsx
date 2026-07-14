"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/fields";
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
      <label className="flex items-center gap-2 text-sm text-ink-muted">
        Per page
        <Select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          aria-label="Results per page"
          className="w-auto py-1.5 tabular-nums"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </label>

      <div className="flex items-center gap-3">
        <span className="text-sm tabular-nums text-ink-muted" aria-live="polite">
          Page {pageIndex + 1}
        </span>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onPrev} disabled={!hasPrev || isLoading}>
            <ChevronLeft aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
            Previous
          </Button>
          <Button size="sm" onClick={onNext} disabled={!hasNext || isLoading}>
            Next
            <ChevronRight aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Button>
        </div>
      </div>
    </div>
  );
}

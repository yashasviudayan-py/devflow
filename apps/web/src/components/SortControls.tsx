"use client";

import type { SortOrder } from "@/lib/listQuery";

type SortOption = {
  value: string;
  label: string;
};

type SortControlsProps = {
  sortBy: string | undefined;
  sortOrder: SortOrder | undefined;
  options: readonly SortOption[];
  onChange: (next: { sortBy: string | undefined; sortOrder: SortOrder | undefined }) => void;
};

const selectClassName =
  "block rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";

/**
 * "Sort by" + order controls. The empty `sortBy` option ("Default") maps to no
 * `sortBy` param, which the API treats as its default (createdAt). Order applies
 * either way, so it is always shown.
 */
export function SortControls({ sortBy, sortOrder, options, onChange }: SortControlsProps) {
  return (
    <div className="flex items-end gap-2">
      <label className="text-sm font-medium text-neutral-700">
        <span className="mb-1 block">Sort by</span>
        <select
          value={sortBy ?? ""}
          onChange={(event) => onChange({ sortBy: event.target.value || undefined, sortOrder })}
          className={selectClassName}
        >
          <option value="">Default</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-medium text-neutral-700">
        <span className="mb-1 block">Order</span>
        <select
          value={sortOrder ?? "asc"}
          onChange={(event) => onChange({ sortBy, sortOrder: event.target.value as SortOrder })}
          className={selectClassName}
          aria-label="Sort order"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </label>
    </div>
  );
}

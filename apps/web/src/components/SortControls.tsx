"use client";

import { Select } from "@/components/ui/fields";
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

/**
 * "Sort by" + order controls. The empty `sortBy` option ("Default") maps to no
 * `sortBy` param, which the API treats as its default (createdAt). Order applies
 * either way, so it is always shown.
 */
export function SortControls({ sortBy, sortOrder, options, onChange }: SortControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="block">
        <span className="sr-only">Sort by</span>
        <Select
          value={sortBy ?? ""}
          onChange={(event) => onChange({ sortBy: event.target.value || undefined, sortOrder })}
          aria-label="Sort by"
          className="w-auto"
        >
          <option value="">Sort: Default</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              Sort: {option.label}
            </option>
          ))}
        </Select>
      </label>

      <label className="block">
        <span className="sr-only">Sort order</span>
        <Select
          value={sortOrder ?? "asc"}
          onChange={(event) => onChange({ sortBy, sortOrder: event.target.value as SortOrder })}
          aria-label="Sort order"
          className="w-auto"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </Select>
      </label>
    </div>
  );
}

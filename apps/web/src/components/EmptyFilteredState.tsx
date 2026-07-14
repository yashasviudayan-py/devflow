"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/states";

type EmptyFilteredStateProps = {
  // Plural noun for the message, e.g. "projects" or "tasks".
  noun: string;
  onReset: () => void;
};

/**
 * Shown when a search/filter returns nothing but the collection itself is not
 * empty — distinct from the "nothing created yet" empty state. Offers a reset so
 * the user is never stranded on an empty filtered view.
 */
export function EmptyFilteredState({ noun, onReset }: EmptyFilteredStateProps) {
  return (
    <EmptyState
      variant="filtered"
      title={`No matching ${noun}`}
      description={`No ${noun} match the current filters. Adjust them or start over.`}
      action={<Button onClick={onReset}>Reset filters</Button>}
    />
  );
}

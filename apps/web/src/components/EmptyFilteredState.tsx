"use client";

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
    <div className="rounded-md border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
      <h3 className="text-base font-semibold text-neutral-950">No matching {noun}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
        No {noun} match the current filters.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-block rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
      >
        Reset filters
      </button>
    </div>
  );
}

"use client";

import type { TaskFilterInput, TaskPriority, TaskStatus } from "@devflow/shared";
import type { OrganizationMember } from "@/lib/api";
import { priorityOptions, statusOptions } from "@/lib/taskOptions";

type TaskFiltersProps = {
  filters: TaskFilterInput;
  members: OrganizationMember[];
  onChange: (filters: TaskFilterInput) => void;
};

const selectClassName =
  "block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";

export function TaskFilters({ filters, members, onChange }: TaskFiltersProps) {
  const hasActiveFilter = Boolean(filters.status || filters.priority || filters.assigneeId);

  return (
    <div className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-white p-4 sm:flex-row sm:items-end">
      <label className="flex-1 text-sm font-medium text-neutral-700">
        Status
        <select
          value={filters.status ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              status: (event.target.value || undefined) as TaskStatus | undefined,
            })
          }
          className={`mt-1 ${selectClassName}`}
        >
          <option value="">All</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex-1 text-sm font-medium text-neutral-700">
        Priority
        <select
          value={filters.priority ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              priority: (event.target.value || undefined) as TaskPriority | undefined,
            })
          }
          className={`mt-1 ${selectClassName}`}
        >
          <option value="">All</option>
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex-1 text-sm font-medium text-neutral-700">
        Assignee
        <select
          value={filters.assigneeId ?? ""}
          onChange={(event) =>
            onChange({ ...filters, assigneeId: event.target.value || undefined })
          }
          className={`mt-1 ${selectClassName}`}
        >
          <option value="">Anyone</option>
          {members.map((member) => (
            <option key={member.user.id} value={member.user.id}>
              {member.user.name}
            </option>
          ))}
        </select>
      </label>

      {hasActiveFilter ? (
        <button
          type="button"
          onClick={() => onChange({})}
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}

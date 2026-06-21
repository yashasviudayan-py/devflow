"use client";

import type { TaskPriority, TaskStatus } from "@devflow/shared";
import type { OrganizationMember } from "@/lib/api";
import { priorityOptions, statusOptions } from "@/lib/taskOptions";

// The set of task filters the API supports (search and sort are handled
// separately by SearchInput / SortControls).
export type TaskFiltersValue = {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  unassigned?: boolean;
  // ISO `YYYY-MM-DD` date strings, as produced by <input type="date">.
  dueAfter?: string;
  dueBefore?: string;
};

type TaskFiltersProps = {
  value: TaskFiltersValue;
  members: OrganizationMember[];
  onChange: (next: TaskFiltersValue) => void;
};

// Sentinel for the "Unassigned" assignee option. The API models this as a
// separate `unassigned=true` flag rather than an assignee id, so we translate.
const UNASSIGNED = "__unassigned__";

const controlClassName =
  "block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";

export function TaskFilters({ value, members, onChange }: TaskFiltersProps) {
  const assigneeValue = value.unassigned ? UNASSIGNED : (value.assigneeId ?? "");

  function handleAssigneeChange(selected: string) {
    if (selected === UNASSIGNED) {
      onChange({ ...value, unassigned: true, assigneeId: undefined });
    } else {
      onChange({ ...value, unassigned: undefined, assigneeId: selected || undefined });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 rounded-md border border-neutral-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-sm font-medium text-neutral-700">
        Status
        <select
          value={value.status ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              status: (event.target.value || undefined) as TaskStatus | undefined,
            })
          }
          className={`mt-1 ${controlClassName}`}
        >
          <option value="">All</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-medium text-neutral-700">
        Priority
        <select
          value={value.priority ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              priority: (event.target.value || undefined) as TaskPriority | undefined,
            })
          }
          className={`mt-1 ${controlClassName}`}
        >
          <option value="">All</option>
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-medium text-neutral-700">
        Assignee
        <select
          value={assigneeValue}
          onChange={(event) => handleAssigneeChange(event.target.value)}
          className={`mt-1 ${controlClassName}`}
        >
          <option value="">Anyone</option>
          <option value={UNASSIGNED}>Unassigned</option>
          {members.map((member) => (
            <option key={member.user.id} value={member.user.id}>
              {member.user.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-medium text-neutral-700">
        Due after
        <input
          type="date"
          value={value.dueAfter ?? ""}
          onChange={(event) => onChange({ ...value, dueAfter: event.target.value || undefined })}
          className={`mt-1 ${controlClassName}`}
        />
      </label>

      <label className="text-sm font-medium text-neutral-700">
        Due before
        <input
          type="date"
          value={value.dueBefore ?? ""}
          onChange={(event) => onChange({ ...value, dueBefore: event.target.value || undefined })}
          className={`mt-1 ${controlClassName}`}
        />
      </label>
    </div>
  );
}

"use client";

import type { TaskPriority, TaskStatus } from "@devflow/shared";
import type { ReactNode } from "react";
import { Input, Select } from "@/components/ui/fields";
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

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

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
    <div className="grid grid-cols-1 gap-3 rounded-card border border-edge-subtle bg-surface p-4 sm:grid-cols-2 lg:grid-cols-3">
      <FilterField label="Status">
        <Select
          value={value.status ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              status: (event.target.value || undefined) as TaskStatus | undefined,
            })
          }
        >
          <option value="">All</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </FilterField>

      <FilterField label="Priority">
        <Select
          value={value.priority ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              priority: (event.target.value || undefined) as TaskPriority | undefined,
            })
          }
        >
          <option value="">All</option>
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </FilterField>

      <FilterField label="Assignee">
        <Select value={assigneeValue} onChange={(event) => handleAssigneeChange(event.target.value)}>
          <option value="">Anyone</option>
          <option value={UNASSIGNED}>Unassigned</option>
          {members.map((member) => (
            <option key={member.user.id} value={member.user.id}>
              {member.user.name}
            </option>
          ))}
        </Select>
      </FilterField>

      <FilterField label="Due after">
        <Input
          type="date"
          value={value.dueAfter ?? ""}
          onChange={(event) => onChange({ ...value, dueAfter: event.target.value || undefined })}
        />
      </FilterField>

      <FilterField label="Due before">
        <Input
          type="date"
          value={value.dueBefore ?? ""}
          onChange={(event) => onChange({ ...value, dueBefore: event.target.value || undefined })}
        />
      </FilterField>
    </div>
  );
}

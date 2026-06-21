import { projectSortFields, taskSortFields } from "@devflow/shared";
import type { ProjectSortField, TaskSortField } from "@/lib/listQuery";

// Human-readable labels for the sortable fields the API allows. Derived from the
// shared field arrays so the dropdowns stay in sync with the backend allow-lists.
const projectSortLabels: Record<ProjectSortField, string> = {
  name: "Name",
  createdAt: "Created",
  updatedAt: "Updated",
};

const taskSortLabels: Record<TaskSortField, string> = {
  title: "Title",
  status: "Status",
  priority: "Priority",
  dueDate: "Due date",
  createdAt: "Created",
  updatedAt: "Updated",
};

export const projectSortOptions = projectSortFields.map((value) => ({
  value,
  label: projectSortLabels[value],
}));

export const taskSortOptions = taskSortFields.map((value) => ({
  value,
  label: taskSortLabels[value],
}));

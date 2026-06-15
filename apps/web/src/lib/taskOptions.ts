import { taskPriorities, taskStatuses, type TaskPriority, type TaskStatus } from "@devflow/shared";

// Maps the API's enum values to human-readable labels. Derived from the shared
// enum arrays so the options stay in sync with the backend.
const statusLabels: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  DONE: "Done",
  CANCELED: "Canceled",
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const statusOptions = taskStatuses.map((value) => ({
  value,
  label: statusLabels[value],
}));

export const priorityOptions = taskPriorities.map((value) => ({
  value,
  label: priorityLabels[value],
}));

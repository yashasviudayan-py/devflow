"use client";

import { updateTaskSchema, type TaskPriority, type TaskStatus } from "@devflow/shared";
import { useState, type FormEvent } from "react";
import { FormAlert, SubmitButton, TextField } from "@/components/AuthCard";
import { ApiError, updateTask, type OrganizationMember, type Task } from "@/lib/api";
import { priorityOptions, statusOptions } from "@/lib/taskOptions";

type FieldErrors = Partial<Record<"title" | "description" | "dueDate", string>>;

type EditTaskFormProps = {
  task: Task;
  members: OrganizationMember[];
  onCancel: () => void;
  onSaved: (task: Task) => void;
};

const selectClassName =
  "mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";

// A stored ISO timestamp (e.g. 2026-06-15T00:00:00.000Z) maps to the YYYY-MM-DD
// value a <input type="date"> expects.
function toDateInputValue(iso: string | null) {
  return iso ? iso.slice(0, 10) : "";
}

export function EditTaskForm({ task, members, onCancel, onSaved }: EditTaskFormProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? "");
  const [dueDate, setDueDate] = useState(toDateInputValue(task.dueDate));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    // `null` clears optional fields (unassign / no due date / no description);
    // a value sets them. status/priority are always sent.
    const parsed = updateTaskSchema.safeParse({
      title,
      description: description.trim() === "" ? null : description,
      status,
      priority,
      assigneeId: assigneeId === "" ? null : assigneeId,
      dueDate: dueDate === "" ? null : dueDate,
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        title: errors.title?.[0],
        description: errors.description?.[0],
        dueDate: errors.dueDate?.[0],
      });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const updated = await updateTask(task.id, parsed.data);
      onSaved(updated);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 403) {
        setFormError("You do not have permission to edit this task.");
      } else if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <FormAlert message={formError} /> : null}

      <TextField
        label="Title"
        name="title"
        type="text"
        autoComplete="off"
        value={title}
        error={fieldErrors.title}
        onChange={setTitle}
      />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={description}
          aria-invalid={fieldErrors.description ? true : undefined}
          aria-describedby={fieldErrors.description ? "description-error" : undefined}
          onChange={(event) => setDescription(event.target.value)}
          className={selectClassName}
        />
        {fieldErrors.description ? (
          <p id="description-error" className="mt-1 text-sm text-red-600">
            {fieldErrors.description}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-neutral-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as TaskStatus)}
            className={selectClassName}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-neutral-700">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
            className={selectClassName}
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="assigneeId" className="block text-sm font-medium text-neutral-700">
            Assignee
          </label>
          <select
            id="assigneeId"
            name="assigneeId"
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
            className={selectClassName}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-neutral-700">
            Due date (optional)
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            value={dueDate}
            aria-invalid={fieldErrors.dueDate ? true : undefined}
            aria-describedby={fieldErrors.dueDate ? "dueDate-error" : undefined}
            onChange={(event) => setDueDate(event.target.value)}
            className={selectClassName}
          />
          {fieldErrors.dueDate ? (
            <p id="dueDate-error" className="mt-1 text-sm text-red-600">
              {fieldErrors.dueDate}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <SubmitButton label="Save changes" pendingLabel="Saving…" isPending={isSubmitting} />
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

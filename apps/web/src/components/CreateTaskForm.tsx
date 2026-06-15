"use client";

import { createTaskSchema, type TaskPriority, type TaskStatus } from "@devflow/shared";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormAlert, SubmitButton, TextField } from "@/components/AuthCard";
import { ApiError, createTask, type OrganizationMember } from "@/lib/api";
import { priorityOptions, statusOptions } from "@/lib/taskOptions";

type FieldErrors = Partial<Record<"title" | "description" | "dueDate", string>>;

type CreateTaskFormProps = {
  projectId: string;
  // Organization members for the assignee dropdown. Empty array hides nothing —
  // the dropdown still offers "Unassigned".
  members: OrganizationMember[];
};

const selectClassName =
  "mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 outline-none transition focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";

export function CreateTaskForm({ projectId, members }: CreateTaskFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    // Optional fields are omitted when blank so the API applies its defaults.
    const parsed = createTaskSchema.safeParse({
      title,
      description: description.trim() === "" ? undefined : description,
      status,
      priority,
      assigneeId: assigneeId === "" ? undefined : assigneeId,
      dueDate: dueDate === "" ? undefined : dueDate,
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
      const task = await createTask(projectId, parsed.data);
      router.push(`/tasks/${task.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 403) {
        setFormError("You do not have permission to create tasks in this project.");
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

      <SubmitButton label="Create task" pendingLabel="Creating…" isPending={isSubmitting} />
    </form>
  );
}

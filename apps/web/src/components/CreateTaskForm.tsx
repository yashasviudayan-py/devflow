"use client";

import { createTaskSchema, type TaskPriority, type TaskStatus } from "@devflow/shared";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormAlert, SubmitButton, TextField } from "@/components/AuthCard";
import { fieldErrorProps, FormField, Input, Select, Textarea } from "@/components/ui/fields";
import { ApiError, createTask, type OrganizationMember } from "@/lib/api";
import { priorityOptions, statusOptions } from "@/lib/taskOptions";

type FieldErrors = Partial<Record<"title" | "description" | "dueDate", string>>;

type CreateTaskFormProps = {
  projectId: string;
  // Organization members for the assignee dropdown. Empty array hides nothing —
  // the dropdown still offers "Unassigned".
  members: OrganizationMember[];
};

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

      <FormField htmlFor="description" label="Description (optional)" error={fieldErrors.description}>
        <Textarea
          id="description"
          name="description"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          {...fieldErrorProps("description", fieldErrors.description)}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField htmlFor="status" label="Status">
          <Select
            id="status"
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as TaskStatus)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField htmlFor="priority" label="Priority">
          <Select
            id="priority"
            name="priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField htmlFor="assigneeId" label="Assignee">
          <Select
            id="assigneeId"
            name="assigneeId"
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField htmlFor="dueDate" label="Due date (optional)" error={fieldErrors.dueDate}>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            {...fieldErrorProps("dueDate", fieldErrors.dueDate)}
          />
        </FormField>
      </div>

      <SubmitButton label="Create task" pendingLabel="Creating…" isPending={isSubmitting} />
    </form>
  );
}

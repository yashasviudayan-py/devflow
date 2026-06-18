import { z } from "zod";
import { taskPriorities, taskStatuses } from "./types.js";

const authEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Email must be a valid email address.")
  .max(254, "Email must be at most 254 characters.");

const signupPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be at most 128 characters.");

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  email: authEmailSchema,
  password: signupPasswordSchema,
});

export const loginSchema = z.object({
  email: authEmailSchema,
  password: z
    .string()
    .min(1, "Password is required.")
    .max(128, "Password must be at most 128 characters."),
});

const projectNameSchema = z
  .string()
  .trim()
  .min(2, "Project name must be at least 2 characters.")
  .max(100, "Project name must be at most 100 characters.");

const projectDescriptionSchema = z
  .string()
  .trim()
  .max(500, "Project description must be at most 500 characters.");

export const createProjectSchema = z.object({
  name: projectNameSchema,
  description: projectDescriptionSchema.optional(),
});

export const updateProjectSchema = z
  .object({
    name: projectNameSchema.optional(),
    description: projectDescriptionSchema.optional(),
    archived: z.boolean().optional(),
  })
  .refine(
    (input) =>
      input.name !== undefined || input.description !== undefined || input.archived !== undefined,
    {
      message: "At least one field must be provided.",
    },
  );

const taskTitleSchema = z
  .string()
  .trim()
  .min(1, "Task title is required.")
  .max(200, "Task title must be at most 200 characters.");

const taskDescriptionSchema = z
  .string()
  .trim()
  .max(5000, "Task description must be at most 5000 characters.");

const taskStatusSchema = z.enum(taskStatuses);
const taskPrioritySchema = z.enum(taskPriorities);

// Assignee/filter ids are validated for shape only; whether the id refers to a
// real organization member is enforced server-side, where the org is known.
const taskUserIdSchema = z.string().trim().min(1, "User id is required.");

// `z.coerce.date()` accepts ISO date strings from JSON bodies and yields a Date.
const taskDueDateSchema = z.coerce.date();

export const createTaskSchema = z.object({
  title: taskTitleSchema,
  description: taskDescriptionSchema.optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: taskUserIdSchema.optional(),
  dueDate: taskDueDateSchema.optional(),
});

export const updateTaskSchema = z
  .object({
    title: taskTitleSchema.optional(),
    // `null` clears the field; `undefined` leaves it unchanged.
    description: taskDescriptionSchema.nullable().optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    assigneeId: taskUserIdSchema.nullable().optional(),
    dueDate: taskDueDateSchema.nullable().optional(),
    archived: z.boolean().optional(),
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: "At least one field must be provided.",
  });

// Optional query filters for listing a project's tasks. Unknown keys are stripped.
export const taskFilterSchema = z.object({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: taskUserIdSchema.optional(),
});

// Comment bodies are free-form text. They are trimmed, must not be empty, and
// are capped to keep payloads (and the eventual UI) reasonable.
const commentBodySchema = z
  .string()
  .trim()
  .min(1, "Comment must not be empty.")
  .max(5000, "Comment must be at most 5000 characters.");

export const createCommentSchema = z.object({
  body: commentBodySchema,
});

export const updateCommentSchema = z.object({
  body: commentBodySchema,
});

const organizationNameSchema = z
  .string()
  .trim()
  .min(2, "Organization name must be at least 2 characters.")
  .max(100, "Organization name must be at most 100 characters.");

const organizationSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug must be at least 2 characters.")
  .max(50, "Slug must be at most 50 characters.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug may only contain lowercase letters, numbers, and hyphens.",
  );

export const createOrganizationSchema = z.object({
  name: organizationNameSchema,
  slug: organizationSlugSchema.optional(),
});

export const updateOrganizationSchema = z
  .object({
    name: organizationNameSchema.optional(),
    slug: organizationSlugSchema.optional(),
  })
  .refine((input) => input.name !== undefined || input.slug !== undefined, {
    message: "At least one field must be provided.",
  });

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

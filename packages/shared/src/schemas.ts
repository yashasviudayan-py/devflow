import { z } from "zod";

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

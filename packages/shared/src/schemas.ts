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

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters.").max(100),
  description: z.string().trim().max(500).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters.").max(100),
  description: z.string().trim().max(500).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

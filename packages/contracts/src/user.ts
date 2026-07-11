import { z } from "zod";

export const updateUserInput = z
  .object({
    /** Deprecated rollout field. New servers always derive ownership from the session. */
    userId: z.string().optional(),
    email: z.string().email().optional(),
    displayName: z.string().trim().min(1).max(50).optional(),
  })
  .refine((input) => input.email !== undefined || input.displayName !== undefined, {
    message: "At least one profile field is required",
  });
export type UpdateUserInput = z.infer<typeof updateUserInput>;

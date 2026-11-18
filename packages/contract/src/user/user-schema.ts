import { z } from "zod";

import { emailAddress } from "../auth/auth-schema.ts";
import { MAX_DISPLAY_NAME_LENGTH } from "../post/post-schema.ts";

export const updateUserInput = z
  .object({
    displayName: z.string().trim().min(1).max(MAX_DISPLAY_NAME_LENGTH).optional(),
    email: emailAddress.optional(),
  })
  .refine((input) => input.email !== undefined || input.displayName !== undefined, {
    message: "At least one profile field is required",
  });

export type UpdateUserInput = z.infer<typeof updateUserInput>;

export const getUserInput = z
  .object({
    userId: z.string(),
  })
  .required();

export const getUserStatsInput = z.object({
  userId: z.string(),
});

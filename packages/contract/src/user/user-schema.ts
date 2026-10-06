import { z } from "zod";

import { emailAddress } from "../auth/auth-schema.ts";
import { MAX_DISPLAY_NAME_LENGTH } from "../post/post-schema.ts";

// The retired `userId` rollout field is deliberately absent rather than
// `.optional()`. The server has always derived ownership from the session and
// ignored it, and `z.object` strips unknown keys — so binaries in the wild that
// still send it keep working, and the value they send can never name a
// different account. See `packages/service/src/security-contracts.test.ts`.
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

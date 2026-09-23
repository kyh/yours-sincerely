import { z } from "zod";

import { newEmail } from "./auth.ts";
import { MAX_DISPLAY_NAME_LENGTH } from "./post.ts";

export const ANONYMOUS_DISPLAY_NAME = "Anonymous";

/** `||`, not `??`: a cleared pen name arrives as `""`, and a blank name must read
    as Anonymous everywhere, or the same writer gets a different name and avatar
    per surface. */
export const resolveDisplayName = (name?: string | null) => name || ANONYMOUS_DISPLAY_NAME;

// The retired `userId` rollout field is deliberately absent rather than
// `.optional()`. The server has always derived ownership from the session and
// ignored it, and `z.object` strips unknown keys — so binaries in the wild that
// still send it keep working, and the value they send can never name a
// different account. See `packages/api/src/security-contracts.test.ts`.
export const updateUserInput = z
  .object({
    displayName: z.string().trim().min(1).max(MAX_DISPLAY_NAME_LENGTH).optional(),
    email: newEmail.optional(),
  })
  .refine((input) => input.email !== undefined || input.displayName !== undefined, {
    message: "At least one profile field is required",
  });
export type UpdateUserInput = z.infer<typeof updateUserInput>;

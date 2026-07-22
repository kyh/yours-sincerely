import { z } from "zod";

// The retired `userId` rollout field is deliberately absent rather than
// `.optional()`. The server has always derived ownership from the session and
// ignored it, and `z.object` strips unknown keys — so binaries in the wild that
// still send it keep working, and the value they send can never name a
// different account. See `packages/api/src/security-contracts.test.ts`.
export const updateUserInput = z
  .object({
    email: z.string().email().optional(),
    displayName: z.string().trim().min(1).max(50).optional(),
  })
  .refine((input) => input.email !== undefined || input.displayName !== undefined, {
    message: "At least one profile field is required",
  });
export type UpdateUserInput = z.infer<typeof updateUserInput>;

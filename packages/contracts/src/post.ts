import { z } from "zod";

/** A letter, not an essay. There is no cap in the compose UI and none in the
    database, so this is the only bound on a public, unauthenticated endpoint.
    10,000 characters is ~1,700 words — far beyond any love letter, and small
    enough that it is not a storage/DoS lever. */
export const MAX_POST_LENGTH = 10_000;

/** The same 50-char rule `updateUserInput.displayName` already enforces.
    `createdBy` flows into BOTH `Post.createdBy` AND the new anonymous user's
    `User.displayName`, so a second, looser rule on the same column was a hole.
    One column, one rule. */
export const MAX_DISPLAY_NAME_LENGTH = 50;

export const createPostInput = z.object({
  parentId: z.string().optional(),
  content: z
    .string()
    .trim()
    .min(10, "You'll need to write a bit more than that")
    .max(MAX_POST_LENGTH, "That's a bit too long for a letter"),
  createdBy: z.string().trim().max(MAX_DISPLAY_NAME_LENGTH).optional(),
});
export type CreatePostInput = z.infer<typeof createPostInput>;

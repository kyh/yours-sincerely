import { z } from "zod";

import { serverTimestamp } from "../content.ts";

/** A letter, not an essay. There is no cap in the compose UI and none in the
    database, so this is the only bound on a public, unauthenticated endpoint.
    10,000 characters is ~1,700 words, and small enough not to be a storage/DoS
    lever.

    Chosen against production, not guessed: of 166,710 letters the average is 193
    characters and the 99.9th percentile is 4,399, so this cap is ~2x the longest
    letter almost anyone writes. It is NOT above the longest — 29 letters exceed
    it, the longest being 52,299 characters. That is deliberate and it is safe,
    because nothing re-validates a letter that already exists: there is no
    updatePost/editPost path, so `createPostInput` only ever judges new writing.
    Adding one would retroactively make those 29 letters unsaveable by their own
    authors — check this cap first if you ever do. */
export const MAX_POST_LENGTH = 10_000;

/** The same 50-char rule `updateUserInput.displayName` already enforces.
    `createdBy` flows into BOTH `Post.createdBy` AND the new anonymous user's
    `User.displayName`, so a second, looser rule on the same column was a hole.
    One column, one rule.

    Production has 95 posts whose `createdBy` is longer than this (longest: 99)
    and 6 anonymous users whose `displayName` is (longest: 71) — all from the
    years when `createdBy` was unbounded. Nothing re-validates a post, so those 95
    are inert. The 6 users would be asked to shorten their name the next time they
    save their profile, which is `updateUserInput`'s pre-existing behaviour on
    `main` and not something this cap introduced. */
export const MAX_DISPLAY_NAME_LENGTH = 50;

export const FEED_PAGE_SIZE = 5;

export const createPostInput = z.object({
  content: z
    .string()
    .trim()
    .min(10, "You'll need to write a bit more than that")
    .max(MAX_POST_LENGTH, "That's a bit too long for a letter"),
  createdBy: z.string().trim().max(MAX_DISPLAY_NAME_LENGTH).optional(),
  parentId: z.string().optional(),
});
export type CreatePostInput = z.infer<typeof createPostInput>;

export const getPostsByUserInput = z.object({
  userId: z.string(),
});

export const getPostInput = z.object({
  postId: z.string(),
});

const feedCursor = z.object({
  createdAt: serverTimestamp,
  postId: z.string(),
});
export type FeedCursor = z.output<typeof feedCursor>;

/** The `Feed` view only ever contains root posts (`parentId IS NULL`), so it has
    no `parentId` filter to offer — comments are read through `getPost`. */
export const getFeedInput = z.object({
  cursor: feedCursor.optional(),
  // Bounded: `getFeed` is a public, unauthenticated endpoint. Both clients ask
  // for FEED_PAGE_SIZE, so 50 is generous headroom while still capping the blast radius.
  limit: z.number().int().min(1).max(50).optional(),
  userId: z.string().optional(),
});

export const deletePostInput = z.object({
  postId: z.string(),
});

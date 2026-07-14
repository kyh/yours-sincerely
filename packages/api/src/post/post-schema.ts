import { z } from "zod";

import type { post } from "@repo/db/drizzle-schema";

export { createPostInput, type CreatePostInput } from "@repo/contracts/post";

export const getPostsByUserInput = z.object({
  userId: z.string(),
});

export const getPostInput = z.object({
  postId: z.string(),
});

/** The `Feed` view only ever contains root posts (`parentId IS NULL`), so it has
    no `parentId` filter to offer — comments are read through `getPost`. */
export const getFeedInput = z.object({
  userId: z.string().optional(),
  cursor: z
    .object({
      createdAt: z.string(),
      postId: z.string(),
    })
    .optional(),
  // Bounded: `getFeed` is a public, unauthenticated endpoint. Both clients ask
  // for 5, so 50 is generous headroom while still capping the blast radius.
  limit: z.number().int().min(1).max(50).optional(),
});

export const deletePostInput = z.object({
  postId: z.string(),
});

type DbPost = typeof post.$inferSelect;

/** The wire shape both clients consume. It must not change.
 *
 *  `baseLikeCount` (a seeded offset) and `flagCount` (moderation state) are
 *  omitted deliberately: they are server-owned and have never been on the wire.
 *  `likeCount`/`commentCount` are re-declared so the shape stays identical now
 *  that columns of the same name exist on `Post`. */
type FeedPost = Omit<
  DbPost,
  "baseLikeCount" | "updatedAt" | "likeCount" | "commentCount" | "flagCount"
> & {
  createdBy: string;
  parentId: string;
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
  comments?: FeedPost[];
};

type ConvertOptions = {
  isLiked: boolean;
  /** Explicit, because the two callers legitimately differ: a post's own
      `commentCount` column counts ALL children, while `getPost` reports the
      comments it actually returns (hidden ones are filtered out first). */
  commentCount: number;
  comments?: FeedPost[];
};

/** Reads the denormalized counters (migration 0004) instead of counting loaded
    rows. `getPost` used to load every `Like` and `Flag` row for a post AND each
    of its comments purely to derive two integers and a boolean — a popular
    letter shipped thousands of rows to Node to do it. */
export const convertDbPostToFeedPost = (dbPost: DbPost, options: ConvertOptions): FeedPost => {
  return {
    id: dbPost.id,
    content: dbPost.content,
    createdAt: dbPost.createdAt,
    userId: dbPost.userId,
    createdBy: dbPost.createdBy || "Anonymous",
    parentId: dbPost.parentId || "",
    isLiked: options.isLiked,
    likeCount: (dbPost.baseLikeCount ?? 0) + dbPost.likeCount,
    commentCount: options.commentCount,
    comments: options.comments,
  };
};

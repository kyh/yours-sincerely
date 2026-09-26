import { oc, type } from "@orpc/contract";
import { z } from "zod";

import { serverTimestamp } from "./content.ts";
import { createPostInput } from "./post.ts";

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

/** A row of the `Feed` view plus the viewer's like. The view holds root posts
    only, so `parentId` is always null here. */
export interface FeedPost {
  commentCount: number;
  content: string;
  createdAt: string;
  createdBy: string;
  id: string;
  isLiked: boolean;
  likeCount: number;
  parentId: string | null;
  userId: string;
}

/** A letter or comment as `getPost` serves it.
 *
 *  `baseLikeCount` (a seeded offset) and `flagCount` (moderation state) are
 *  server-owned and have never been on the wire. `parentId` is `""` on a root
 *  letter where the feed sends null. No current client reads either, but both
 *  are already in the wild: unifying them is a compat change, not a cleanup. */
export interface WirePost {
  commentCount: number;
  comments?: WirePost[];
  content: string;
  createdAt: string;
  createdBy: string;
  id: string;
  isLiked: boolean;
  likeCount: number;
  parentId: string;
  userId: string;
}

export interface PermalinkPost extends WirePost {
  comments: WirePost[];
}

interface CreatedPost {
  createdBy: string | null;
  id: string;
  parentId: string | null;
  userId: string;
}

/** Outputs are `type<T>()`, not zod: they are checked at compile time against
    each handler's return and pass through untouched at runtime, so declaring
    them adds no validation, no stripping and no cost to the wire. */
export const postContract = {
  createPost: oc.input(createPostInput).output(type<{ post: CreatedPost | undefined }>()),
  deletePost: oc.input(deletePostInput).output(type<{ post: { id: string } | undefined }>()),
  getFeed: oc.input(getFeedInput).output(
    type<{
      nextCursor: z.output<typeof feedCursor> | undefined;
      posts: FeedPost[];
    }>(),
  ),
  getPost: oc.input(getPostInput).output(type<{ post: PermalinkPost }>()),
  getPostsByUser: oc.input(getPostsByUserInput).output(type<{ posts: { createdAt: string }[] }>()),
};

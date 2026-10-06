import { type } from "@orpc/contract";

import { protectedBase, publicBase } from "../base.ts";
import type { FeedCursor } from "./post-schema.ts";
import {
  createPostInput,
  deletePostInput,
  getFeedInput,
  getPostInput,
  getPostsByUserInput,
} from "./post-schema.ts";

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
  createPost: publicBase.input(createPostInput).output(type<{ post: CreatedPost | undefined }>()),
  deletePost: protectedBase
    .input(deletePostInput)
    .output(type<{ post: { id: string } | undefined }>()),
  getFeed: publicBase.input(getFeedInput).output(
    type<{
      nextCursor: FeedCursor | undefined;
      posts: FeedPost[];
    }>(),
  ),
  getPost: publicBase.input(getPostInput).output(type<{ post: PermalinkPost }>()),
  getPostsByUser: publicBase
    .input(getPostsByUserInput)
    .output(type<{ posts: { createdAt: string }[] }>()),
};

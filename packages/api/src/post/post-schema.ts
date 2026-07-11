import { z } from "zod";

import type { like, post } from "@repo/db/drizzle-schema";

export { createPostInput, type CreatePostInput } from "@repo/contracts/post";

export const getPostsByUserInput = z.object({
  userId: z.string(),
});

export const getPostInput = z.object({
  postId: z.string(),
});

export const getFeedInput = z.object({
  userId: z.string().optional(),
  parentId: z.string().optional(),
  cursor: z
    .object({
      createdAt: z.string(),
      postId: z.string(),
    })
    .optional(),
  limit: z.number().optional(),
});

export const deletePostInput = z.object({
  postId: z.string(),
});

type DbPost = typeof post.$inferSelect & {
  likes?: (typeof like.$inferSelect)[];
  posts?: (typeof post.$inferSelect)[];
};

type FeedPost = Omit<typeof post.$inferSelect, "baseLikeCount" | "updatedAt"> & {
  createdBy: string;
  parentId: string;
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
  comments?: FeedPost[];
};

export const convertDbPostToFeedPost = (dbPost: DbPost, userId?: string): FeedPost => {
  return {
    id: dbPost.id,
    content: dbPost.content,
    createdAt: dbPost.createdAt,
    userId: dbPost.userId,
    createdBy: dbPost.createdBy || "Anonymous",
    parentId: dbPost.parentId || "",
    isLiked: !!dbPost.likes?.find((like) => like.userId === userId),
    likeCount: (dbPost.baseLikeCount ?? 0) + (dbPost.likes ?? []).length,
    commentCount: dbPost.posts?.length ?? 0,
    comments: dbPost.posts?.map((comment) => convertDbPostToFeedPost(comment)),
  };
};

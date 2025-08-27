import { z } from "zod";

import type { like, post } from "@repo/db/drizzle-schema";

export const getPostsByUserInput = z.object({
  userId: z.string(),
});
export type GetPostsByUserInput = z.infer<typeof getPostsByUserInput>;

export const getPostInput = z.object({
  postId: z.string(),
});
export type GetPostInput = z.infer<typeof getPostInput>;

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
export type GetFeedInput = z.infer<typeof getFeedInput>;

export const createPostInput = z.object({
  parentId: z.string().optional(),
  content: z.string().min(10, "You'll need to write a bit more than that"),
  createdBy: z.string().optional(),
});
export type CreatePostInput = z.infer<typeof createPostInput>;

export const deletePostInput = z.object({
  postId: z.string(),
});
export type DeletePostInput = z.infer<typeof deletePostInput>;

type DbPost = typeof post.$inferSelect & {
  likes?: (typeof like.$inferSelect)[];
  posts?: (typeof post.$inferSelect)[];
};

type FeedPost = Omit<
  typeof post.$inferSelect,
  "baseLikeCount" | "updatedAt"
> & {
  createdBy: string;
  parentId: string;
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
  comments?: FeedPost[];
};

export const convertDbPostToFeedPost = (
  dbPost: DbPost,
  userId?: string,
): FeedPost => {
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

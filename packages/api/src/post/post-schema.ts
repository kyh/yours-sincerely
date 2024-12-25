import { z } from "zod";

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

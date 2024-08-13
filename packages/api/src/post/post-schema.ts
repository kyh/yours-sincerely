import { z } from "zod";

export const getPostInput = z.object({
  user: z
    .object({
      id: z.string(),
    })
    .optional(),
  id: z.string(),
});

export const getPostListInput = z.object({
  userId: z.string().optional(),
  parentId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().optional(),
});

export const getPostAllInput = z.object({ userId: z.string() });

export const createPostInput = z.object({
  parentId: z.string().optional(),
  content: z.string(),
  createdBy: z.string().optional(),
});

export const updatePostInput = z.object({
  id: z.string(),
  parentId: z.string().optional(),
  content: z.string(),
  userId: z.string(),
});

export const deletePostInput = z.object({ id: z.string() });

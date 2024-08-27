import { z } from "zod";

export const getPostInput = z.object({
  id: z.string(),
});

export const getFeedInput = z.object({
  userId: z.string().optional(),
  parentId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().optional(),
});

export const createPostInput = z.object({
  parentId: z.string().optional(),
  content: z.string(),
  createdBy: z.string().optional(),
});

export const updatePostInput = z.object({
  id: z.string(),
  content: z.string(),
});

export const deletePostInput = z.object({
  id: z.string(),
});

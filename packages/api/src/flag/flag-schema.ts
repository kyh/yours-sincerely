import { z } from "zod";

export const allInput = z.object({ id: z.string() });

export const byIdInput = z.object({
  postId: z.string(),
  userId: z.string(),
});

export const createInput = z.object({
  comment: z.string().optional(),
  resolved: z.boolean().optional(),
  postId: z.string(),
  userId: z.string(),
});

export const deleteInput = z.object({ postId: z.string(), userId: z.string() });

import { z } from "zod";

export const getFlagInput = z.object({
  postId: z.string(),
  userId: z.string(),
});

export const getFlagAllInput = z.object({ id: z.string() });

export const createFlagInput = z.object({
  comment: z.string().optional(),
  resolved: z.boolean().optional(),
  postId: z.string(),
  userId: z.string(),
});

export const deleteFlagInput = z.object({
  postId: z.string(),
  userId: z.string(),
});

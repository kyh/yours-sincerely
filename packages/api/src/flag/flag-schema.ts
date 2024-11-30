import { z } from "zod";

export const createFlagInput = z.object({
  postId: z.string(),
});

export const deleteFlagInput = z.object({
  postId: z.string(),
});

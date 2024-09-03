import { z } from "zod";

export const getBlockInput = z.object({
  blockerId: z.string(),
  blockingId: z.string(),
});

export const createBlockInput = z.object({
  blockerId: z.string(),
  blockingId: z.string(),
});

export const deleteBlockInput = z.object({
  blockerId: z.string(),
  blockingId: z.string(),
});

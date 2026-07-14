import { z } from "zod";

export const createBlockInput = z.object({
  blockingId: z.string(),
});

export const deleteBlockInput = z.object({
  blockingId: z.string(),
});

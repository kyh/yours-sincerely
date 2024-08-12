import { z } from "zod";

export const getBlockInput = z.object({
  blockerId: z.string(),
  blockingId: z.string(),
});

export const getBlockAllInput = z
  .object({
    id: z.string(),
  })
  .optional();

export const createBlockInput = z.object({
  blockerId: z.string(),
  blockingId: z.string(),
});

export const deleteBlockInput = z.object({
  blockerId: z.string(),
  blockingId: z.string(),
});

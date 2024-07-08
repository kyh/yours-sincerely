import { z } from "zod";

export const allInput = z
  .object({
    id: z.string(),
  })
  .optional();

export const byIdInput = z.object({
  blockerId: z.string(),
  blockingId: z.string(),
});

export const createInput = z.object({
  blockerId: z.string(),
  blockingId: z.string(),
});

export const deleteInput = z.object({
  blockerId: z.string(),
  blockingId: z.string(),
});

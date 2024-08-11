import { z } from "zod";

export const byIdInput = z.object({
  user: z
    .object({
      id: z.string(),
    })
    .optional(),
  id: z.string(),
});

export const listInput = z.object({
  userId: z.string().optional(),
  parentId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().optional(),
});

export const allInput = z.object({ userId: z.string() });

export const createInput = z.object({
  parentId: z.string().optional(),
  content: z.string(),
  createdBy: z.string().optional(),
});

export const updateInput = z.object({
  id: z.string(),
  parentId: z.string().optional(),
  content: z.string(),
  userId: z.string(),
});

export const deleteInput = z.object({ id: z.string() });

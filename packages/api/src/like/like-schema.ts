import { z } from "zod";

export const allInput = z.object({ id: z.string() });

export const byIdInput = z.object({
  postId: z.string(),
  userId: z.string(),
});

export const createInput = z.object({ postId: z.string() });

export const deleteInput = z.object({ id: z.string() });

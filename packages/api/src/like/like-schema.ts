import { z } from "zod";

export const getLikeInput = z.object({
  postId: z.string(),
  userId: z.string(),
});

export const getLikeAllInput = z.object({ id: z.string() });

export const createLikeInput = z.object({ postId: z.string() });

export const deleteLikeInput = z.object({ id: z.string() });

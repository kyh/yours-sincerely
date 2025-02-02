import { z } from "zod";

export const createLikeInput = z.object({ postId: z.string() });

export const deleteLikeInput = z.object({ postId: z.string() });

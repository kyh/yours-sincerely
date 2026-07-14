import { z } from "zod";

export const createFlagInput = z.object({
  postId: z.string(),
  /** Persisted to the (previously never-written) `Flag.comment` column. A queue
      of reasonless flags is nearly worthless to whoever reviews them later. */
  reason: z.string().trim().max(500).optional(),
});

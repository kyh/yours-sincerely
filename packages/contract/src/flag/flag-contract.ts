import { type } from "@orpc/contract";
import { z } from "zod";

import { publicBase } from "../base.ts";

export const createFlagInput = z.object({
  postId: z.string(),
  /** Persisted to the `Flag.comment` column. A queue of reasonless flags is
      nearly worthless to whoever reviews them later.
      A blank reason is no reason: stored as NULL, never as `""`, and never a
      400 — refusing an abuse report over whitespace helps nobody. */
  reason: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((reason) => reason || undefined),
});

export const flagContract = {
  /** Only the key comes back: the stored row would tell whoever is minting
      identities which of them carry moderation authority (`countsTowardHide`). */
  createFlag: publicBase.input(createFlagInput).output(type<{ flag: { postId: string } }>()),
};

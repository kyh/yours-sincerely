import { oc, type } from "@orpc/contract";
import { z } from "zod";

export const createFlagInput = z.object({
  postId: z.string(),
  /** Persisted to the (previously never-written) `Flag.comment` column. A queue
      of reasonless flags is nearly worthless to whoever reviews them later. */
  reason: z.string().trim().max(500).optional(),
});

export const flagContract = {
  /** Only the key comes back: the stored row would tell whoever is minting
      identities which of them carry moderation authority (`countsTowardHide`). */
  createFlag: oc.input(createFlagInput).output(type<{ flag: { postId: string } }>()),
};

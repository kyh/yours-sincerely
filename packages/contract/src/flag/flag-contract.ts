import { type } from "@orpc/contract";

import { publicBase } from "../base.ts";
import { createFlagInput } from "./flag-schema.ts";

export const flagContract = {
  /** Only the key comes back: the stored row would tell whoever is minting
      identities which of them carry moderation authority (`countsTowardHide`). */
  createFlag: publicBase.input(createFlagInput).output(type<{ flag: { postId: string } }>()),
};

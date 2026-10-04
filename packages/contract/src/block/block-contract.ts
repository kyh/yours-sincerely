import { type } from "@orpc/contract";
import { z } from "zod";

import { protectedBase, publicBase } from "../base.ts";

export const createBlockInput = z.object({
  blockingId: z.string(),
});

export const deleteBlockInput = z.object({
  blockingId: z.string(),
});

interface Block {
  blockerId: string;
  blockingId: string;
}

/** A row of the blocker's own inventory. No excerpt of the blocked author's
    letters, by design: see `listBlocks` in `packages/service`. */
export interface BlockedWriter {
  blockingId: string;
  displayImage: string | null;
  displayName: string | null;
}

export const blockContract = {
  createBlock: publicBase.input(createBlockInput).output(type<{ block: Block | undefined }>()),
  deleteBlock: protectedBase.input(deleteBlockInput).output(type<{ block: Block | undefined }>()),
  listBlocks: protectedBase.output(type<{ blocks: BlockedWriter[] }>()),
};

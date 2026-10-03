import { oc, type } from "@orpc/contract";
import { z } from "zod";

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
    letters, by design: see `listBlocks` in `packages/api`. */
export interface BlockedWriter {
  blockingId: string;
  displayImage: string | null;
  displayName: string | null;
}

export const blockContract = {
  createBlock: oc.input(createBlockInput).output(type<{ block: Block | undefined }>()),
  deleteBlock: oc.input(deleteBlockInput).output(type<{ block: Block | undefined }>()),
  listBlocks: oc.output(type<{ blocks: BlockedWriter[] }>()),
};

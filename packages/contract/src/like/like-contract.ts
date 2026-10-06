import { type } from "@orpc/contract";

import { protectedBase, publicBase } from "../base.ts";
import { createLikeInput, deleteLikeInput } from "./like-schema.ts";

interface Like {
  createdAt: string;
  postId: string;
  updatedAt: string;
  userId: string;
}

/** The server's own count after the write, so a client can patch its cache
    instead of refetching. Undefined when the letter is gone. */
export interface LikeState {
  id: string;
  isLiked: boolean;
  likeCount: number;
}

interface LikeResult {
  like: Like | undefined;
  post: LikeState | undefined;
}

export const likeContract = {
  createLike: publicBase.input(createLikeInput).output(type<LikeResult>()),
  deleteLike: protectedBase.input(deleteLikeInput).output(type<LikeResult>()),
};

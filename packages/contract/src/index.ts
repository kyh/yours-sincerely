import type {
  InferContractRouterInputs,
  InferContractRouterOutputs,
  RouterContractClient,
} from "@orpc/contract";

import { authContract } from "./auth/auth-contract.ts";
import { blockContract } from "./block/block-contract.ts";
import { flagContract } from "./flag/flag-contract.ts";
import { likeContract } from "./like/like-contract.ts";
import { notificationContract } from "./notification/notification-contract.ts";
import { postContract } from "./post/post-contract.ts";
import { promptContract } from "./prompt/prompt-contract.ts";
import { pushContract } from "./push/push-contract.ts";
import { userContract } from "./user/user-contract.ts";

/** The whole wire API. `@repo/service` implements it; clients type against it
    without importing a line of server code. */
export const contract = {
  auth: authContract,
  block: blockContract,
  flag: flagContract,
  like: likeContract,
  notification: notificationContract,
  post: postContract,
  prompt: promptContract,
  push: pushContract,
  user: userContract,
};

export type Contract = typeof contract;
export type ContractClient = RouterContractClient<Contract>;
export type RouterInputs = InferContractRouterInputs<Contract>;
export type RouterOutputs = InferContractRouterOutputs<Contract>;

export type { FeedPost } from "./post/post-contract.ts";
export type FeedFilters = Omit<RouterInputs["post"]["getFeed"], "cursor">;

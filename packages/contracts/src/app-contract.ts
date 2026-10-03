import type {
  ContractRouterClient,
  InferContractRouterInputs,
  InferContractRouterOutputs,
} from "@orpc/contract";

import { authContract } from "./auth-contract.ts";
import { blockContract } from "./block-contract.ts";
import { flagContract } from "./flag-contract.ts";
import { likeContract } from "./like-contract.ts";
import { notificationContract } from "./notification-contract.ts";
import { postContract } from "./post-contract.ts";
import { promptContract } from "./prompt-contract.ts";
import { pushContract } from "./push-contract.ts";
import { userContract } from "./user-contract.ts";

/** The whole wire API. `packages/api` implements it; clients type against it
    without importing a line of server code. */
export const appContract = {
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

export type AppContract = typeof appContract;
export type AppClient = ContractRouterClient<AppContract>;
export type RouterInputs = InferContractRouterInputs<AppContract>;
export type RouterOutputs = InferContractRouterOutputs<AppContract>;

export type FeedFilters = Omit<RouterInputs["post"]["getFeed"], "cursor">;

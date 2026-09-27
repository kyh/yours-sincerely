import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import type { AppRouter } from "./root-router";

export { createORPCContext } from "./orpc";
export { type AppRouter, appRouter } from "./root-router";

export type RouterInputs = InferRouterInputs<AppRouter>;
export type RouterOutputs = InferRouterOutputs<AppRouter>;

export type FeedPost = RouterOutputs["post"]["getFeed"]["posts"][number];
export type FeedFilters = Omit<RouterInputs["post"]["getFeed"], "cursor">;

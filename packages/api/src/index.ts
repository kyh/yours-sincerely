import type { AppRouter } from "./root-router";
import type { InferRouterOutputs } from "@orpc/server";
import { appRouter } from "./root-router";
import { createORPCContext } from "./orpc";

type RouterOutputs = InferRouterOutputs<AppRouter>;

export { createORPCContext, appRouter };
export type { AppRouter, RouterOutputs };

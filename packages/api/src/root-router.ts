import type { ORPCContext } from "./orpc";
import { appContract } from "@repo/contracts/app-contract";
import { implement } from "@orpc/server";

import { authRouter } from "./auth/auth-router";
import { blockRouter } from "./block/block-router";
import { flagRouter } from "./flag/flag-router";
import { likeRouter } from "./like/like-router";
import { notificationRouter } from "./notification/notification-router";
import { postRouter } from "./post/post-router";
import { promptRouter } from "./prompt/prompt-router";
import { pushRouter } from "./push/push-router";
import { userRouter } from "./user/user-router";

/** Checked against `appContract`: a router missing from here, or one wired to
    the wrong key, is a type error rather than a 404 in production. */
export const appRouter = implement(appContract).$context<ORPCContext>().router({
  auth: authRouter,
  block: blockRouter,
  flag: flagRouter,
  like: likeRouter,
  notification: notificationRouter,
  post: postRouter,
  prompt: promptRouter,
  push: pushRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

import { authRouter } from "./auth/auth-router";
import { blockRouter } from "./block/block-router";
import { flagRouter } from "./flag/flag-router";
import { likeRouter } from "./like/like-router";
import { notificationRouter } from "./notification/notification-router";
import { os } from "./orpc";
import { postRouter } from "./post/post-router";
import { promptRouter } from "./prompt/prompt-router";
import { pushRouter } from "./push/push-router";
import { userRouter } from "./user/user-router";

/** Checked against `@repo/contract`: a router missing from here, or one wired to
    the wrong key, is a type error rather than a 404 in production. */
export const appRouter = os.router({
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

import { authRouter } from "./auth/auth-router";
import { blockRouter } from "./block/block-router";
import { flagRouter } from "./flag/flag-router";
import { likeRouter } from "./like/like-router";
// import { notificationsRouter } from "./notification/notification-router";
import { postRouter } from "./post/post-router";
import { promptRouter } from "./prompt/prompt-router";
import { createTRPCRouter } from "./trpc";
import { userRouter } from "./user/user-router";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  block: blockRouter,
  flag: flagRouter,
  like: likeRouter,
  // notification: notificationsRouter,
  post: postRouter,
  prompt: promptRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

import { accountRouter } from "./account/account-router";
import { adminRouter } from "./admin/admin-router";
import { authRouter } from "./auth/auth-router";
import { blockRouter } from "./block/block-router";
import { flagRouter } from "./flag/flag-router";
import { likeRouter } from "./like/like-router";
import { postRouter } from "./post/post-router";
import { promptRouter } from "./prompt/prompt-router";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  auth: authRouter,
  account: accountRouter,
  block: blockRouter,
  post: postRouter,
  flag: flagRouter,
  like: likeRouter,
  prompt: promptRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

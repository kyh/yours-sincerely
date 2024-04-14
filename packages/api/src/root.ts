import { authRouter } from "./routers/auth";
import { flagRouter } from "./routers/posts/flag";
import { likeRouter } from "./routers/posts/like";
import { postsRouter } from "./routers/posts/posts";
import { promptRouter } from "./routers/posts/prompt";
import { accountRouter } from "./routers/user/account";
import { blockRouter } from "./routers/user/block";
import { userRouter } from "./routers/user/user";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  block: blockRouter,
  account: accountRouter,
  posts: postsRouter,
  flag: flagRouter,
  like: likeRouter,
  prompt: promptRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

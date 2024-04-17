import { accountRouter } from "./routers/account";
import { blockRouter } from "./routers/block";
import { flagRouter } from "./routers/flag";
import { likeRouter } from "./routers/like";
import { postsRouter } from "./routers/post";
import { promptRouter } from "./routers/prompt";
import { userRouter } from "./routers/user";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
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

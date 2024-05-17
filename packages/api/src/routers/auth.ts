import { createTRPCRouter, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) {
      return null;
    }

    return {
      id: ctx.user.id,
      displayName: ctx.user.user_metadata.displayName as string,
      displayImage: ctx.user.user_metadata.displayImage as string,
      role: ctx.user.user_metadata.role as string,
      weeklyDigestEmail: ctx.user.user_metadata.weeklyDigestEmail as boolean,
      disabled: ctx.user.user_metadata.disabled as boolean,
      email: ctx.user.email ?? "",
    };
  }),
});

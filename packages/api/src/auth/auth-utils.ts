import type { Context } from "../trpc";

export const getUserId = async (ctx: Context, displayName?: string) => {
  let userId = ctx.user?.id;

  // If the user is not logged in, create an anonymous user
  if (!userId) {
    const authResponse = await ctx.supabase.auth.signInAnonymously({
      options: {
        data: {
          displayName: displayName ?? "Anonymous",
        },
      },
    });

    if (authResponse.error || !authResponse.data.user) {
      throw authResponse.error;
    }

    userId = authResponse.data.user.id;
  }

  return userId;
};

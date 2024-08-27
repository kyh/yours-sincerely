import { setDeprecatedSession } from "../auth/deprecated-session";
import { createTRPCRouter, superAdminProcedure } from "../trpc";
import {
  banUserInput,
  getUserInput,
  getUsersInput,
  impersonateUserInput,
  reactivateUserInput,
} from "./admin-schema";

export const adminRouter = createTRPCRouter({
  getUser: superAdminProcedure
    .input(getUserInput)
    .query(async ({ ctx, input }) => {
      const response = await ctx.supabase
        .from("User")
        .select("*")
        .eq("id", input.userId)
        .single();

      if (response.error) {
        throw response.error;
      }

      return response.data;
    }),

  getUsers: superAdminProcedure
    .input(getUsersInput)
    .query(async ({ ctx, input }) => {
      const page = parseInt(input.page);
      const perPage = parseInt(input.per_page);
      const offset = (page - 1) * perPage;

      let query = ctx.supabase
        .from("User")
        .select("*", { count: "exact" })
        .limit(perPage)
        .range(offset, offset + perPage - 1);
      if (input.query) {
        query = query.like("name", `%${input.query}%`);
      }
      const response = await query;

      if (response.error) {
        throw response.error;
      }

      const pageCount = Math.ceil((response.count ?? 0) / perPage);
      return { data: response.data, pageCount };
    }),

  impersonateUser: superAdminProcedure
    .input(impersonateUserInput)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) {
        throw new Error(
          `You cannot perform a destructive action on your own account as a Super Admin`,
        );
      }

      const {
        data: { user },
        error,
      } = await ctx.supabase.auth.admin.getUserById(input.userId);

      if (!user) {
        setDeprecatedSession(input.userId);
        await ctx.supabase.auth.signOut();
        return null;
      }

      if (error) {
        throw new Error(`Error fetching user`);
      }

      const email = user.email;

      if (!email) {
        throw new Error(`User has no email. Cannot impersonate`);
      }

      const { error: linkError, data } =
        await ctx.supabase.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: {
            redirectTo: `/`,
          },
        });

      if (linkError ?? !data) {
        throw new Error(`Error generating magic link`);
      }

      const response = await fetch(data.properties.action_link, {
        method: "GET",
        redirect: "manual",
      });

      const location = response.headers.get("Location");

      if (!location) {
        throw new Error(
          `Error generating magic link. Location header not found`,
        );
      }

      const hash = new URL(location).hash.substring(1);
      const query = new URLSearchParams(hash);
      const accessToken = query.get("access_token");
      const refreshToken = query.get("refresh_token");

      if (!accessToken || !refreshToken) {
        throw new Error(
          `Error generating magic link. Tokens not found in URL hash.`,
        );
      }

      return {
        accessToken,
        refreshToken,
      };
    }),

  banUser: superAdminProcedure
    .input(banUserInput)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) {
        throw new Error(
          `You cannot perform a destructive action on your own account as a Super Admin`,
        );
      }

      await ctx.supabase.auth.admin.updateUserById(input.userId, {
        ban_duration: "876600h",
      });

      await ctx.supabase
        .from("User")
        .update({ disabled: true })
        .eq("id", input.userId);
    }),

  reactivateUser: superAdminProcedure
    .input(reactivateUserInput)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) {
        throw new Error(
          `You cannot perform a destructive action on your own account as a Super Admin`,
        );
      }

      await ctx.supabase.auth.admin.updateUserById(input.userId, {
        ban_duration: "none",
      });

      await ctx.supabase
        .from("User")
        .update({ disabled: false })
        .eq("id", input.userId);
    }),
});

import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

// import { createPasswordHash, validatePassword } from "../auth";

export const defaultSelect = {
  id: true,
  uid: true,
  email: true,
  emailVerified: true,
  displayName: true,
  displayImage: true,
  role: true,
  weeklyDigestEmail: true,
  disabled: true,
  createdAt: false,
  passwordHash: false,
  name: true,
  image: true,
};

export const userRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.user.findMany({
      select: defaultSelect,
    });
  }),

  byId: publicProcedure
    .input(
      z.object({
        uid: z.string(),
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.db.user.findUnique({
        where: input,
        select: defaultSelect,
      });
    }),

  byEmail: publicProcedure
    .input(
      z.object({
        email: z.string(),
        password: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      const validateCredential = true;

      // if (user?.passwordHash && input.password) {
      //   validateCredential = await validatePassword(input.password, user.passwordHash);
      // }

      return user;
    }),

  create: publicProcedure
    .input(
      z.object({
        email: z.string().optional(),
        uid: z.string().optional(),
        displayName: z.string().optional(),
        displayImage: z.string().optional(),
        password: z.string().optional(),
        account: z
          .object({
            provider: z.string(),
            providerAccountId: z.string(),
            accessToken: z.string(),
            refreshToken: z.string(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data = {
        uid: input.uid,
        email: input.email,
        displayName: input.displayName ?? "Anonymous",
        displayImage: input.displayImage,
        passwordHash: "",
        role: "USER",
        weeklyDigestEmail: true,
        disabled: false,
        accounts: {},
      };

      // if (input.password) {
      //   data.passwordHash = await createPasswordHash(input.password);
      // }

      if (input.account) {
        data.accounts = {
          create: [
            {
              provider: input.account.provider,
              providerAccountId: input.account.providerAccountId,
              accessToken: input.account.accessToken,
              refreshToken: input.account.refreshToken,
            },
          ],
        };
      }

      return ctx.db.user.create({
        data: data,
        select: defaultSelect,
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().optional(),
        displayName: z.string().optional(),
        displayImage: z.string().optional(),
        password: z.string().optional(),
        passwordHash: z.string().optional(),
        weeklyDigestEmail: z.boolean().optional(),
        account: z
          .object({
            provider: z.string(),
            providerAccountId: z.string(),
            accessToken: z.string(),
            refreshToken: z.string(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, password, ...data } = input;

      // if (password) {
      //   data.passwordHash = await createPasswordHash(password);
      // }

      return ctx.db.user.update({
        where: { id },
        data: data,
        select: defaultSelect,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.user.delete({
        where: input,
        select: defaultSelect,
      });
    }),
});

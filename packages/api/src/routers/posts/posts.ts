import { Knock } from "@knocklabs/node";
import { addDays, isBefore } from "date-fns";
import { z } from "zod";

import type {
  Flag as PrismaFlag,
  Like as PrismaLike,
  Post as PrismaPost,
} from "@prisma/client";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc";
import { defaultSelect } from "../user/user";

const knockClient = new Knock(process.env.KNOCK_SECRET_API_KEY);

const POST_EXPIRY_DAYS_AGO = 21;

type Post = Partial<PrismaPost> & {
  createdBy?: string | null;
  likeCount?: number | null;
  isLiked?: boolean | null;
  commentCount?: number | null;
  comments?: Post[];
};
type Flag = Partial<PrismaFlag>;
type Like = Partial<PrismaLike>;

type QueriedPost = Post & {
  flags?: Flag[];
  likes?: Like[];
  _count: {
    comments?: number;
    likes?: number;
    flags?: number;
  };
};

type CursorOption =
  | { skip: number; cursor: { id: string } }
  | Record<string, never>;

const formatPost = (post: QueriedPost): Post => {
  const formatted = {
    ...post,
    createdBy: post.createdBy ?? "Anonymous",
    commentCount: post._count.comments,
    likeCount: (post.baseLikeCount ?? 0) + (post._count.likes ?? 0),
    isLiked: post.likes ? !!post.likes.length : false,
  };

  if (formatted.comments) {
    const comments = formatted.comments as QueriedPost[];
    formatted.comments = comments.map((c: QueriedPost) => formatPost(c));
  }

  return formatted;
};

export const postsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        user: z
          .object({
            id: z.string(),
          })
          .optional(),
        filters: z
          .object({
            parentId: z.string().optional(),
            cursor: z.string().optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const blocks = await ctx.db.block.findMany({
        where: {
          // blockerId: input.user?.id,
          blockerId: ctx?.user?.id,
        },
      });

      const blockingMap = blocks.reduce(
        (acc, block) => {
          acc[block.blockingId] = true;
          return acc;
        },
        {} as Record<string, boolean>,
      );

      const cursorOption: CursorOption = input.filters?.cursor
        ? {
            skip: 1,
            cursor: { id: input.filters?.cursor },
          }
        : {};

      const whereOption = input.filters?.parentId
        ? { parentId: input.filters?.parentId }
        : {
            createdAt: {
              gte: addDays(new Date(), -POST_EXPIRY_DAYS_AGO),
            },
            parentId: null,
          };

      return ctx.db.post
        .findMany({
          take: 5,
          ...cursorOption,
          where: {
            ...whereOption,
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            flags: {
              where: {
                // userId: input.user?.id ?? "",
                userId: ctx?.user?.id ?? "",
              },
            },
            likes: {
              where: {
                // userId: input.user?.id ?? "",
                userId: ctx?.user?.id ?? "",
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
                flags: true,
              },
            },
          },
        })
        .then((posts) =>
          posts
            .filter((post) => {
              if (
                // if post has been flagged by user
                post.flags.length ||
                // if post has been flagged many times (by anyone)
                post._count.flags > 2 ||
                // if post is created a someone the user has blocked
                blockingMap[post.userId]
              ) {
                return false;
              }
              return true;
            })
            .map(formatPost),
        );
    }),

  all: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.post
        .findMany({
          where: {
            userId: input.userId,
            parentId: null,
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            _count: {
              select: {
                likes: true,
              },
            },
          },
        })
        .then((posts) => posts.map(formatPost));
    }),

  byId: publicProcedure
    .input(
      z.object({
        user: z
          .object({
            id: z.string(),
          })
          .optional(),
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const inclusions = {
        flags: {
          where: {
            userId: input.user?.id ?? "",
          },
        },
        likes: {
          where: {
            userId: input.user?.id ?? "",
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            flags: true,
          },
        },
      };

      const post = await ctx.db.post.findUnique({
        where: {
          id: input.id,
        },
        include: {
          comments: {
            orderBy: {
              createdAt: "desc",
            },
            include: inclusions,
          },
          ...inclusions,
        },
      });

      if (
        // if post doesnt exist
        !post ||
        // if user has flagged the post
        post.flags.length ||
        // if post has been flagged many times (by anyone)
        post._count.flags > 2 ||
        // if post has timed out
        isBefore(post.createdAt, addDays(new Date(), -POST_EXPIRY_DAYS_AGO))
      ) {
        return null;
      }

      return formatPost(post);
    }),

  create: protectedProcedure
    .input(
      z.object({
        parentId: z.string().optional(),
        content: z.string(),
        createdBy: z.string().optional(),
        baseLikeCount: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let user = await ctx.db.user.findUnique({
        where: { uid: ctx.user.id },
        select: defaultSelect,
      });

      if (!user) {
        user = await ctx.db.user.create({
          data: { uid: ctx.user.id, displayName: input.createdBy },
        });
      }

      const created = await ctx.db.post.create({
        data: { ...input, userId: user.uid },
        include: {
          user: {
            select: defaultSelect,
          },
        },
      });

      if (created.parentId) {
        const parentPost = await ctx.db.post.findUnique({
          where: { id: created.parentId },
          include: {
            user: {
              select: defaultSelect,
            },
          },
        });

        const actor = created.user;
        const recipient = parentPost?.user;

        if (actor && recipient) {
          await knockClient.workflows.trigger("new-comment", {
            data: {
              parentPostId: parentPost.id,
              commentPostId: created.id,
            },
            actor: {
              id: actor.id,
              displayName: actor.displayName,
            },
            recipients: [
              {
                id: recipient.id,
                displayName: recipient.displayName,
              },
            ],
          });
        }
      }

      return created;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        parentId: z.string().optional(),
        content: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;

      return ctx.db.post.update({
        where: {
          id: id,
        },
        data: data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.post.delete({
        where: input,
      });
    }),
});

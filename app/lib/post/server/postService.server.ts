import { addDays, isBefore } from "date-fns";
import type { Prisma } from "@prisma/client";
import { prisma } from "~/lib/core/server/prisma.server";
// import { knock } from "~/lib/core/server/knock.server";
import type { Post } from "~/lib/post/data/postSchema";
import { POST_EXPIRY_DAYS_AGO } from "~/lib/post/data/postSchema";
import type { Flag } from "~/lib/post/data/flagSchema";
import type { Like } from "~/lib/post/data/likeSchema";
import type { User } from "~/lib/user/data/userSchema";
import { defaultSelect } from "~/lib/user/server/userService.server";
import { getBlockList } from "~/lib/user/server/blockService.server";

type QueriedPost = Post & {
  flags?: Flag[];
  likes?: Like[];
  _count: {
    comments?: number;
    likes?: number;
    flags?: number;
  };
};

const formatPost = (post: QueriedPost): Post => {
  const formatted = {
    ...post,
    createdBy: post.createdBy || "Anonymous",
    commentCount: post._count.comments,
    likeCount: (post.baseLikeCount || 0) + (post._count.likes || 0),
    isLiked: post.likes ? !!post.likes.length : false,
  };

  if (formatted.comments) {
    const comments = formatted.comments as QueriedPost[];
    formatted.comments = comments.map((c: QueriedPost) => formatPost(c));
  }

  return formatted;
};

type CursorOption = { skip: number; cursor: { id: string } } | {};

type PostFilters = {
  parentId?: string | null;
  cursor?: string | null;
};

export const getPostList = async (
  user: User | null,
  filters: PostFilters = {}
) => {
  const blocks = await getBlockList(user);

  const blockingMap = blocks.reduce((acc, block) => {
    acc[block.blockingId] = true;
    return acc;
  }, {} as Record<string, boolean>);

  const cursorOption: CursorOption = filters.cursor
    ? {
        skip: 1,
        cursor: { id: filters.cursor },
      }
    : {};

  const whereOption = filters.parentId
    ? { parentId: filters.parentId }
    : {
        createdAt: {
          gte: addDays(new Date(), -POST_EXPIRY_DAYS_AGO),
        },
        parentId: null,
      };

  const list = await prisma.post.findMany({
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
          userId: user?.id || "",
        },
      },
      likes: {
        where: {
          userId: user?.id || "",
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
  });

  return list
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
    .map(formatPost) as Post[];
};

export const getAllPostsForUser = async (userId: string) => {
  const list = await prisma.post.findMany({
    where: {
      userId,
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
  });

  return list.map(formatPost) as Post[];
};

export const getPost = async (
  input: Prisma.PostWhereUniqueInput,
  user: User | null
) => {
  const inclusions = {
    flags: {
      where: {
        userId: user?.id || "",
      },
    },
    likes: {
      where: {
        userId: user?.id || "",
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

  const post = await prisma.post.findUnique({
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
};

export const createPost = async (input: Prisma.PostCreateInput) => {
  const { id, ...data } = input;

  const created = await prisma.post.create({
    data,
    include: {
      user: {
        select: defaultSelect,
      },
    },
  });

  // if (created.parentId) {
  //   const parentPost = await prisma.post.findUnique({
  //     where: { id: created.parentId },
  //     include: {
  //       user: {
  //         select: defaultSelect,
  //       },
  //     },
  //   });

  //   const actor = created.user;
  //   const recipient = parentPost?.user;

  //   if (actor && recipient) {
  //     await knock.workflows.trigger("new-comment", {
  //       data: {
  //         parentPostId: parentPost.id,
  //         commentPostId: created.id,
  //       },
  //       actor: {
  //         id: actor.id,
  //         username: actor.username,
  //         displayName: actor.displayName,
  //       },
  //       recipients: [
  //         {
  //           id: recipient.id,
  //           username: recipient.username,
  //           displayName: recipient.displayName,
  //         },
  //       ],
  //     });
  //   }
  // }

  return created;
};

export const updatePost = async (
  input: Prisma.PostWhereUniqueInput & Prisma.PostUpdateInput
) => {
  const { id, ...data } = input;
  const updated = await prisma.post.update({
    where: { id },
    data,
  });

  return updated;
};

export const deletePost = async (input: Prisma.PostWhereUniqueInput) => {
  const deleted = prisma.post.delete({
    where: { id: input.id },
  });

  return deleted;
};

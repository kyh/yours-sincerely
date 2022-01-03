import { addDays } from "date-fns";
import { Prisma } from "@prisma/client";
import { prisma } from "~/lib/core/server/prisma.server";
import { Post, POST_EXPIRY_DAYS_AGO } from "~/lib/post/data/postSchema";
import { Flag } from "~/lib/post/data/flagSchema";
import { Like } from "~/lib/post/data/likeSchema";
import { User } from "~/lib/user/data/userSchema";
import { defaultSelect } from "~/lib/user/server/userService.server";
import { getBlockList } from "~/lib/user/server/blockService.server";

const formatPost = (
  post: Post & {
    flags: Flag[];
    likes: Like[];
    _count: {
      comments: number;
      likes: number;
      flags: number;
    };
  }
): Post => ({
  ...post,
  createdBy: post.createdBy || "Anonymous",
  commentCount: post._count.comments,
  likeCount: post._count.likes,
  isLiked: !!post.likes.length,
});

export const getPostList = async (user: User | null) => {
  const blocks = await getBlockList(user);

  const blockingMap = blocks.reduce((acc, block) => {
    acc[block.blockingId] = true;
    return acc;
  }, {} as Record<string, boolean>);

  const list = await prisma.post.findMany({
    where: {
      createdAt: {
        gte: addDays(new Date(), -POST_EXPIRY_DAYS_AGO),
      },
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
        // if post has been flagged many times
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

export const getPost = async (input: Pick<Post, "id">, user: User | null) => {
  const post = await prisma.post.findUnique({
    where: { id: input.id },
    include: {
      comments: true,
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

  if (!post || post.flags.length || post._count.flags > 2) return null;

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

  return created;
};

export const updatePost = async (
  input: Pick<Post, "id"> & Prisma.PostUpdateInput
) => {
  const { id, ...data } = input;
  const updated = await prisma.post.update({
    where: { id },
    data,
  });

  return updated;
};

export const deletePost = async (input: Pick<Post, "id">) => {
  const deleted = prisma.post.delete({
    where: { id: input.id },
  });

  return deleted;
};

import { addDays } from "date-fns";
import { Prisma } from "@prisma/client";
import { prisma } from "~/lib/core/server/prisma.server";
import { Post, POST_EXPIRY_DAYS_AGO } from "~/lib/post/data/postSchema";
import { Like } from "~/lib/post/data/likeSchema";
import { User } from "~/lib/user/data/userSchema";
import { defaultSelect } from "~/lib/user/server/userService.server";

const formatPost = (
  post: Post & {
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

  return list.filter((post) => post._count.flags < 1).map(formatPost) as Post[];
};

export const getPost = async (input: Pick<Post, "id">, user: User | null) => {
  const post = await prisma.post.findUnique({
    where: { id: input.id },
    include: {
      comments: true,
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

  if (!post || post._count.flags > 0) return null;

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

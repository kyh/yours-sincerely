import type { Prisma } from "@prisma/client";
import { prisma } from "~/lib/core/server/prisma.server";
import type { User } from "~/lib/user/data/userSchema";

export const getLikeList = async (user: User | null) => {
  const list = await prisma.like.findMany({
    where: {
      userId: user?.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return list;
};

export const getPostLike = async (
  input: Prisma.LikePostIdUserIdCompoundUniqueInput
) => {
  const like = await prisma.like.findUnique({
    where: {
      postId_userId: input,
    },
  });

  return like;
};

export const createLike = async (input: Prisma.LikeCreateInput) => {
  const created = await prisma.like.create({
    data: input,
  });

  return created;
};

export const deleteLike = async (
  input: Prisma.LikePostIdUserIdCompoundUniqueInput
) => {
  const deleted = prisma.like.delete({
    where: {
      postId_userId: input,
    },
  });

  return deleted;
};

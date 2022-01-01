import { Prisma } from "@prisma/client";
import { prisma } from "~/lib/core/server/prisma.server";
import { User } from "~/lib/user/data/userSchema";

export const getFlagList = async (user: User | null) => {
  const list = await prisma.flag.findMany({
    where: {
      userId: user?.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return list;
};

export const getPostFlag = async (
  input: Prisma.FlagPostIdUserIdCompoundUniqueInput
) => {
  const flag = await prisma.flag.findUnique({
    where: {
      postId_userId: input,
    },
  });

  return flag;
};

export const createFlag = async (input: Prisma.FlagCreateInput) => {
  const created = await prisma.flag.create({
    data: input,
  });

  return created;
};

export const deleteFlag = async (
  input: Prisma.FlagPostIdUserIdCompoundUniqueInput
) => {
  const deleted = prisma.flag.delete({
    where: {
      postId_userId: input,
    },
  });

  return deleted;
};

import type { Prisma } from "@prisma/client";
import { prisma } from "~/lib/core/server/prisma.server";
import type { User } from "~/lib/user/data/userSchema";

export const getBlockList = async (user: User | null) => {
  const list = await prisma.block.findMany({
    where: {
      blockerId: user?.id,
    },
  });

  return list;
};

export const getBlock = async (
  input: Prisma.BlockBlockerIdBlockingIdCompoundUniqueInput
) => {
  const blocks = await prisma.block.findUnique({
    where: {
      blockerId_blockingId: input,
    },
  });

  return blocks;
};

export const createBlock = async (input: Prisma.BlockCreateInput) => {
  const created = await prisma.block.create({
    data: input,
  });

  return created;
};

export const deleteBlock = async (
  input: Prisma.BlockBlockerIdBlockingIdCompoundUniqueInput
) => {
  const deleted = prisma.block.delete({
    where: {
      blockerId_blockingId: input,
    },
  });

  return deleted;
};

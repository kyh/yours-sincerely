import type { Prisma } from "@prisma/client";
import { prisma } from "~/lib/core/server/prisma.server";
import type { User } from "~/lib/user/data/userSchema";

export const getEnrolledEventList = async (user: User | null) => {
  const list = await prisma.enrolledEvent.findMany({
    where: {
      userId: user?.id,
    },
    orderBy: {
      start: "desc",
    },
  });

  return list;
};

export const getEnrolledEvent = async (
  input: Prisma.EnrolledEventWhereUniqueInput
) => {
  const enrolledEvent = await prisma.enrolledEvent.findUnique({
    where: input,
  });

  return enrolledEvent;
};

export const createEnrolledEvent = async (
  input: Prisma.EnrolledEventCreateInput
) => {
  const created = await prisma.enrolledEvent.create({
    data: input,
  });

  return created;
};

export const deleteEvent = async (
  input: Prisma.EnrolledEventWhereUniqueInput
) => {
  const deleted = prisma.enrolledEvent.delete({
    where: input,
  });

  return deleted;
};

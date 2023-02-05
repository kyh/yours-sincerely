import { prisma } from "~/lib/core/server/prisma.server";

const randomPick = (array: string[]) =>
  array[Math.floor(Math.random() * array.length)];

export const getRandomPrompt = async (count: number) => {
  const itemCount = await prisma.prompt.count();
  const skip = Math.max(0, Math.floor(Math.random() * itemCount) - count);
  const orderBy = randomPick(["id", "content"]);
  const orderDir = randomPick(["asc", "desc"]);

  return prisma.prompt.findMany({
    take: count,
    skip: skip,
    orderBy: { [orderBy]: orderDir },
  });
};

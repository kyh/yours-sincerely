import type { Prisma } from "@prisma/client";
import { prisma } from "~/lib/core/server/prisma.server";

export const getAccount = async ({
  provider,
  providerAccountId,
}: Prisma.AccountProviderProviderAccountIdCompoundUniqueInput) => {
  const account = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    include: {
      user: true,
    },
  });

  return account;
};

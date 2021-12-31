import { Prisma } from "@prisma/client";
import { prisma } from "~/lib/core/server/prisma.server";
import { User } from "~/lib/user/data/userSchema";
import { createPasswordHash } from "~/lib/auth/server/authService.server";

const defaultSelect = {
  id: true,
  email: true,
  emailVerified: true,
  name: true,
  image: true,
  role: true,
  updatedAt: false,
  createdAt: false,
  passwordHash: false,
};

export const getUserList = async (input?: Prisma.UserWhereInput) => {
  const list = await prisma.user.findMany({
    where: input,
    select: defaultSelect,
  });

  return list;
};

export const getUser = async (input: Prisma.UserWhereUniqueInput) => {
  const user = await prisma.user.findUnique({
    where: input,
    select: defaultSelect,
  });

  return user;
};

export const getUserPasswordHash = async (
  input: Prisma.UserWhereUniqueInput
) => {
  const user = await prisma.user.findUnique({ where: input });

  if (user) {
    return {
      user: { ...user, passwordHash: null },
      passwordHash: user.passwordHash,
    };
  }

  return { user: null, passwordHash: null };
};

export const createUser = async (
  input: Prisma.UserCreateInput & {
    password?: string;
    account?: Omit<Prisma.AccountCreateInput, "user">;
  }
) => {
  const data: Prisma.UserCreateInput = {
    email: input.email,
    name: input.name,
    image: input.image,
  };

  if (input.password) {
    data.passwordHash = await createPasswordHash(input.password);
  }

  if (input.account) {
    data.accounts = {
      create: [
        {
          provider: input.account.provider,
          providerAccountId: input.account.providerAccountId,
          accessToken: input.account.accessToken,
          refreshToken: input.account.refreshToken,
        },
      ],
    };
  }

  const created = await prisma.user.create({
    data,
    select: defaultSelect,
  });

  return created;
};

export const updateUser = async (
  input: Pick<User, "id"> & Prisma.UserUpdateInput
) => {
  const { id, ...data } = input;
  const updated = await prisma.user.update({
    where: { id },
    data,
    select: defaultSelect,
  });

  return updated;
};

export const deleteUser = async (input: Pick<User, "id">) => {
  const deleted = await prisma.user.delete({
    where: { id: input.id },
    select: defaultSelect,
  });

  return deleted;
};

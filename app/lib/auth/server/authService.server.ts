import { hash, compare } from "bcrypt";
import { randomBytes } from "crypto";
import { addHours, addDays, isBefore } from "date-fns";
import type { Prisma, TokenType } from "@prisma/client";
import { prisma } from "~/lib/core/server/prisma.server";

const SALT_ROUNDS = 10;

export const createPasswordHash = async (password: string) => {
  const passwordHash = await hash(password, SALT_ROUNDS);
  return passwordHash;
};

export const validatePassword = async (
  password: string,
  passwordHash: string
) => {
  const isMatchingPassword = await compare(password, passwordHash);
  return isMatchingPassword;
};

const getTokenExpiration = (tokenType: TokenType) => {
  switch (tokenType) {
    case "RESET_PASSWORD":
      return addHours(new Date(), 1);
    case "REFRESH_TOKEN":
      return addDays(new Date(), 60);
    default:
      return null;
  }
};

export const generateToken = () => {
  return randomBytes(20).toString("hex");
};

export const createToken = async (
  tokenType: TokenType,
  input: Omit<Prisma.TokenCreateInput, "token" | "type" | "expiresAt">
) => {
  const token = generateToken();
  const expiresAt = getTokenExpiration(tokenType);

  const created = await prisma.token.create({
    data: {
      ...input,
      token,
      type: tokenType,
      expiresAt,
    },
  });

  return created;
};

export const validateToken = async (tokenType: TokenType, token?: string) => {
  if (!token) return false;

  const savedToken = await prisma.token.findUnique({
    where: {
      token_type: {
        token,
        type: tokenType,
      },
    },
  });

  if (
    !savedToken ||
    savedToken.usedAt ||
    (savedToken.expiresAt && !isBefore(new Date(), savedToken.expiresAt))
  ) {
    return false;
  }

  const updated = await prisma.token.update({
    where: { id: savedToken.id },
    data: { usedAt: new Date() },
    include: { user: true },
  });

  return updated.user;
};

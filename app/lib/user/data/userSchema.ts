import { User as PrismaUser } from "@prisma/client";

export type User = Pick<
  PrismaUser,
  "id" | "email" | "username" | "displayName" | "displayImage" | "role"
>;

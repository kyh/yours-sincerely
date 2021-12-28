import { User as PrismaUser } from "@prisma/client";

export type User = Pick<PrismaUser, "id" | "email" | "name" | "image" | "role">;

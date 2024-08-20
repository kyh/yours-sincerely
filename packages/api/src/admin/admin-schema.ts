import { z } from "zod";

export const getUserInput = z.object({
  userId: z.string(),
});

export const getUsersInput = z.object({
  page: z.string().default("1"),
  per_page: z.string().default("10"),
  query: z.string().optional(),
});
export type GetUsersInput = z.infer<typeof getUsersInput>;

export const deleteUserInput = z.object({
  userId: z.string(),
});

export const impersonateUserInput = z.object({
  userId: z.string(),
});

export const banUserInput = z.object({
  userId: z.string(),
});

export const reactivateUserInput = z.object({
  userId: z.string(),
});

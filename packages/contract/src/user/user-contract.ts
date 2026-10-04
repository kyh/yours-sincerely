import { type } from "@orpc/contract";
import { z } from "zod";

import { protectedBase, publicBase } from "../base.ts";
import { updateUserInput } from "../user.ts";

export const getUserInput = z
  .object({
    userId: z.string(),
  })
  .required();

export const getUserStatsInput = z.object({
  userId: z.string(),
});

interface PublicUser {
  displayImage: string | null;
  displayName: string | null;
  id: string;
}

/** The row of `public."getUserStats"(text)`, coerced to numbers at the server
    boundary (`userStatsRow` in `packages/service`). */
export interface UserStats {
  currentPostStreak: number;
  displayName: string | null;
  longestPostStreak: number;
  totalLikeCount: number;
  totalPostCount: number;
  userId: string;
}

export const userContract = {
  deleteUser: protectedBase.output(type<{ user: null }>()),
  getUser: publicBase.input(getUserInput).output(type<{ user: PublicUser | undefined }>()),
  getUserStats: publicBase
    .input(getUserStatsInput)
    .output(type<{ userStats: UserStats | undefined }>()),
  updateUser: protectedBase
    .input(updateUserInput)
    .output(type<{ user: (PublicUser & { email: string | null }) | undefined }>()),
};

import { z } from "zod";

export const getUserInput = z.object({
  userId: z.string(),
});

export const updateUserInput = z.object({
  userId: z.string(),
  email: z.string().optional(),
  displayName: z.string().optional(),
  displayImage: z.string().optional(),
  weeklyDigestEmail: z.boolean().optional(),
});

export const getUserStatsInput = z.object({
  userId: z.string(),
});

import { z } from "zod";

export const getUserInput = z.object({
  id: z.string(),
});

export const updateUserInput = z.object({
  id: z.string(),
  email: z.string().optional(),
  displayName: z.string().optional(),
  displayImage: z.string().optional(),
  weeklyDigestEmail: z.boolean().optional(),
});

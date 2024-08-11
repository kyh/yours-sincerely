import { z } from "zod";

export const byIdInput = z.object({
  id: z.string(),
});

export const updateInput = z.object({
  id: z.string(),
  email: z.string().optional(),
  displayName: z.string().optional(),
  displayImage: z.string().optional(),
  weeklyDigestEmail: z.boolean().optional(),
});

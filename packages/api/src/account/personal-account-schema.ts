import { z } from "zod";

export const updatePictureInput = z.object({
  accountId: z.string(),
  displayImage: z.string().url().nullable(),
});

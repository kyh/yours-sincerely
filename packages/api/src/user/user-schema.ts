import { z } from "zod";

export { updateUserInput, type UpdateUserInput } from "@repo/contracts/user";

export const getUserInput = z
  .object({
    userId: z.string(),
  })
  .required();

export const getUserStatsInput = z.object({
  userId: z.string(),
});

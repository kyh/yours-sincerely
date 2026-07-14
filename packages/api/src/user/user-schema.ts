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

/** The row shape of `public."getUserStats"(text)` (migration 0004).
 *
 *  The counts come back from Postgres as `bigint`/`numeric`, which the driver
 *  hands over as strings; the old `UserStats` view was read through Drizzle,
 *  which coerced them to numbers. `z.coerce.number()` keeps the tRPC wire shape
 *  byte-identical to what both clients already consume — and parsing at the
 *  boundary is what lets `db.execute` be typed without a single `as`. */
export const userStatsRow = z.object({
  userId: z.string(),
  displayName: z.string().nullable(),
  totalPostCount: z.coerce.number(),
  totalLikeCount: z.coerce.number(),
  longestPostStreak: z.coerce.number(),
  currentPostStreak: z.coerce.number(),
});

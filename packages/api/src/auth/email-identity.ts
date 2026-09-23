import type { Db } from "@repo/db/drizzle-client";
import { user } from "@repo/db/drizzle-schema";
import type { AnyColumn } from "drizzle-orm";
import { and, ne, sql } from "drizzle-orm";

/** `lower(email)` is exactly what `User_email_lower_idx` indexes, so this is an
    index seek, not a scan of every anonymous row. */
const sameAddress = (email: AnyColumn, address: string) => sql`lower(${email}) = lower(${address})`;

/**
 * The account an email address signs in to, or undefined.
 *
 * An exact match wins, so every address that resolved before still resolves to
 * the same row. Only then is case ignored, and only when that names ONE
 * account. Accounts that differ only in case predate normalization, and
 * auto-picking one would let a sign-in or a reset land on the other's account.
 */
export const findUserByEmail = async (db: Db, address: string) => {
  const exact = await db.query.user.findFirst({ where: { email: address } });
  if (exact) {
    return exact;
  }

  const [match, ...others] = await db.query.user.findMany({
    limit: 2,
    where: { RAW: (row) => sameAddress(row.email, address) },
  });

  return others.length === 0 ? match : undefined;
};

/** Case-insensitive, so no new account can differ from an existing one only in
    case. `exceptUserId` lets a user re-save their own address. */
export const isEmailTaken = async (db: Db, address: string, exceptUserId?: string) => {
  const [holder] = await db
    .select({ id: user.id })
    .from(user)
    .where(
      and(
        sameAddress(user.email, address),
        exceptUserId === undefined ? undefined : ne(user.id, exceptUserId),
      ),
    )
    .limit(1);

  return holder !== undefined;
};

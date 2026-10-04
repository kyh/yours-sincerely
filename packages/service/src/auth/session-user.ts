import type { Db } from "@repo/db/drizzle-client";

/**
 * The user a session resolves to, as the request context carries it.
 *
 * Columns are allowlisted, not "everything but `passwordHash`": a column added
 * to `User` later stays out of the context, and out of every response built
 * from it, until it is named here. `role` and `sessionEpoch` are for the server
 * only — renewal re-signs with the epoch — and `toViewer` keeps them off the
 * wire.
 */
export const findSessionUser = async (db: Db, userId: string) => {
  const sessionUser = await db.query.user.findFirst({
    columns: {
      disabled: true,
      displayImage: true,
      displayName: true,
      email: true,
      id: true,
      role: true,
      sessionEpoch: true,
    },
    where: { id: userId },
  });

  return sessionUser ?? null;
};

type SessionUser = NonNullable<Awaited<ReturnType<typeof findSessionUser>>>;

type ViewerFields = Pick<SessionUser, "disabled" | "displayImage" | "displayName" | "email" | "id">;

/** What a client is told about its own account. */
export const toViewer = ({ disabled, displayImage, displayName, email, id }: ViewerFields) => ({
  disabled,
  displayImage,
  displayName,
  email,
  id,
});

import { DrizzleQueryError } from "drizzle-orm";

export const FOREIGN_KEY_VIOLATION = "23503";
export const UNIQUE_VIOLATION = "23505";

/** A query Postgres itself rejected. drizzle wraps every driver error in a
    `DrizzleQueryError`, and the postgres.js error carrying the SQLSTATE is its
    `cause`. */
const isRejectedQuery = (
  error: unknown,
): error is DrizzleQueryError & { cause: { code: string } } =>
  error instanceof DrizzleQueryError &&
  error.cause !== undefined &&
  "code" in error.cause &&
  typeof error.cause.code === "string";

/** The SQLSTATE behind a failed query, or undefined for any other failure. */
export const pgErrorCode = (cause: unknown): string | undefined =>
  isRejectedQuery(cause) ? cause.cause.code : undefined;

/** Awaits a write and, when Postgres rejects it with `code`, throws `toError()` in
    its place. oRPC reports any other error as INTERNAL_SERVER_ERROR and the route
    logs it as a fault, so an expected race (the letter was just deleted, the email
    was just taken) would otherwise look to the client exactly like a server bug. */
export const rethrowPgError = async <T>(
  write: PromiseLike<T>,
  code: string,
  toError: () => Error,
): Promise<T> => {
  try {
    return await write;
  } catch (error) {
    if (pgErrorCode(error) === code) {
      throw toError();
    }
    throw error;
  }
};

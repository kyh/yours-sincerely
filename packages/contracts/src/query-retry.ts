/** Both clients' query `retry` rule, minus the oRPC error type each checks
    against, so this package stays free of an oRPC dependency. */

/** The same request gets the same answer: retrying these only holds the screen
    on a spinner through the backoff before it can show the error. */
const PERMANENT_ERROR_CODES: ReadonlySet<string> = new Set([
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
]);

export const isPermanentErrorCode = (code: string) => PERMANENT_ERROR_CODES.has(code);

/** TanStack's own client default. */
export const MAX_QUERY_RETRIES = 3;

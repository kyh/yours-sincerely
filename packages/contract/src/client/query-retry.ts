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

import { ORPCError } from "@orpc/client";
import { isPermanentErrorCode, MAX_QUERY_RETRIES } from "@repo/contracts/query-retry";

/** Query `retry`: network and server failures keep TanStack's retries. */
export const shouldRetryQuery = (failureCount: number, error: Error) =>
  !(error instanceof ORPCError && isPermanentErrorCode(error.code)) &&
  failureCount < MAX_QUERY_RETRIES;

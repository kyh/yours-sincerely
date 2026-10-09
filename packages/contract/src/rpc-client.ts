/**
 * Every RPC call names the `@orpc/client` version it was built with. Expo builds
 * already in the stores predate this header and run 2.0.0-beta.31, whose client
 * reads an error body without `inferable` (dropped in 2.0.0-beta.34) as malformed,
 * so the RPC route adds the field back to errors for a call without it. Remove
 * that once those builds are gone.
 */
export const ORPC_CLIENT_HEADER = "x-orpc-client";

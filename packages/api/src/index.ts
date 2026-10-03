// Server-only: the route handler and the RSC caller. Clients type against
// `@repo/contracts/app-contract`, never against this package.
export { createORPCContext } from "./orpc";
export { type AppRouter, appRouter } from "./root-router";

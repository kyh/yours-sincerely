import type { NextRequest } from "next/server";
import { appRouter, createORPCContext } from "@repo/api";
import { onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { SimpleCsrfProtectionHandlerPlugin } from "@orpc/server/plugins";

// No CORS headers: every client reaches this route same-origin. The web app is
// served from it, the legacy Capacitor app is a remote WebView of the
// production origin (it runs this very bundle), and React Native does not
// enforce CORS.
//
// SimpleCsrfProtection requires an `x-csrf-token` header, which the paired link
// plugin sends and an HTML form cannot set. The session cookie is SameSite=lax
// (see packages/api/src/auth/session.ts), so a cross-origin form POST cannot
// carry it anyway — the plugin is defense-in-depth, not load-bearing. Adding
// permissive CORS headers here would still be the wrong move: paired with
// Allow-Credentials they would reopen the cross-origin path the plugin closes.

// Codes the routers throw as ordinary control flow, not as faults: every
// anonymous hit on a `protectedProcedure` is an UNAUTHORIZED, every failed
// sign-in is one too, and a duplicate signup email is a CONFLICT. The transport
// plugins produce the last two (header-less CSRF probes, GETs on POST-only
// procedures). Logging them buries the errors that actually mean something.
//
// INTERNAL_SERVER_ERROR is deliberately NOT here: oRPC never serializes an
// unmodeled thrown error to the client (it becomes a generic
// INTERNAL_SERVER_ERROR), so this log is the only place the real cause — in
// practice a raw Postgres exception — survives.
const EXPECTED_ERROR_CODES = new Set([
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "BAD_REQUEST",
  "CONFLICT",
  "CSRF_TOKEN_MISMATCH",
  "METHOD_NOT_SUPPORTED",
]);

const handler = new RPCHandler(appRouter, {
  plugins: [new SimpleCsrfProtectionHandlerPlugin()],
  interceptors: [
    onError((error) => {
      if (error instanceof ORPCError && EXPECTED_ERROR_CODES.has(error.code)) return;
      console.error(">>> oRPC Error", error);
    }),
  ],
});

const handleRequest = async (req: NextRequest) => {
  const { response } = await handler.handle(req, {
    prefix: "/api/orpc",
    context: await createORPCContext({ headers: req.headers }),
  });

  return response ?? new Response("Not found", { status: 404 });
};

export { handleRequest as GET, handleRequest as POST };

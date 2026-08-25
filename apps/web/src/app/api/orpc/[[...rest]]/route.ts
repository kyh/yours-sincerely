import type { NextRequest } from "next/server";
import { appRouter, createORPCContext } from "@repo/api";
import { COMMON_ERROR_STATUS_MAP, onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

// No CORS headers, and none belong here: every client reaches this route
// same-origin. The web app is served from it, the legacy Capacitor app is a
// remote WebView of the production origin (it runs this very bundle), and
// React Native does not enforce CORS.
//
// Cross-site protection is the session cookie's SameSite=lax (see
// `sessionCookieOptions` in packages/api/src/auth/session-core.ts): a forged
// cross-site POST reaches the handler carrying no session and does nothing.
// CORS headers paired with Allow-Credentials would hand a cross-origin page an
// authenticated path in and undo that. GET — the one method a cookie-bearing
// navigation can reach — is refused by the handler's default `allowMethods`.
const handler = new RPCHandler(appRouter, {
  clientInterceptors: [
    onError((error) => {
      // An ORPCError is a router answering deliberately: an anonymous hit on a
      // `protectedProcedure`, a failed sign-in, a duplicate signup email.
      // Everything else is a fault, and this log is the only place its cause —
      // in practice a raw Postgres exception — survives, because oRPC hands the
      // client a generic INTERNAL_SERVER_ERROR in its place.
      if (error instanceof ORPCError) return;
      console.error(">>> oRPC Error", error);
    }),
  ],
});

const handleRequest = async (req: NextRequest) => {
  try {
    const context = await createORPCContext({ headers: req.headers });
    const { response } = await handler.handle(req, { prefix: "/api/orpc", context });

    return response ?? new Response("Not found", { status: 404 });
  } catch (error) {
    // Context construction runs before `handle`, so the interceptors above
    // never see a failing session lookup. Log it on the same path and answer
    // in the RPC error shape the client can parse — a bare Next 500 reaches
    // the link as an unparseable body instead.
    console.error(">>> oRPC Error", error);
    const failure = new ORPCError("INTERNAL_SERVER_ERROR");

    return Response.json(
      { json: failure.toJSON() },
      { status: COMMON_ERROR_STATUS_MAP[failure.code] },
    );
  }
};

export { handleRequest as GET, handleRequest as POST };

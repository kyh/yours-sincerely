import type { NextRequest } from "next/server";
import { appRouter, createORPCContext } from "@repo/api";
import { COMMON_ERROR_STATUS_MAP, onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

// No CORS headers, and none belong here: every client reaches this route
// same-origin. The web app is served from it, the legacy Capacitor app is a
// remote WebView of the production origin (it runs this very bundle), and
// React Native does not enforce CORS.
//
// The session cookie's SameSite=lax (see `sessionCookieOptions` in
// packages/api/src/auth/session-core.ts) covers the cross-SITE half: a forged
// POST from another site reaches the handler carrying no session and does
// nothing. `isCrossOrigin` below covers the rest. CORS headers paired with
// Allow-Credentials would hand a cross-origin page an authenticated path in and
// undo both. GET — the one method a cookie-bearing navigation can reach — is
// refused by the handler's default `allowMethods`.
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

/**
 * `SameSite` keys on *site*, not origin, so it stops none of the origins that
 * share this registrable domain: a sibling `*.yourssincerely.org` host, or
 * another port in development, is cross-ORIGIN but same-SITE, and the browser
 * attaches the session cookie to a plain `<form method=POST>` from there. That
 * form needs no preflight, so CORS never gets a say. Browsers set `Origin` on
 * every POST and page script cannot forge it, so an `Origin` that isn't ours is
 * the signal.
 *
 * Absent `Origin` passes: that is the Expo app, whose React Native `fetch`
 * sends none and attaches the session from its own store
 * (`apps/expo/src/lib/api-fetch.ts`), so there is no ambient cookie for another
 * page to ride.
 *
 * Checked at the route boundary rather than in a handler plugin, so it runs
 * once on the real request rather than on sub-requests a client authored, were
 * batching ever added.
 */
const isCrossOrigin = (req: NextRequest) => {
  const origin = req.headers.get("origin");

  return origin !== null && origin !== new URL(req.url).origin;
};

const handleRequest = async (req: NextRequest) => {
  if (isCrossOrigin(req)) {
    return new Response("Cross-origin request blocked.", { status: 403 });
  }

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

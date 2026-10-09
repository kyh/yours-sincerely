import type { NextRequest } from "next/server";
import { ORPC_CLIENT_HEADER } from "@repo/contract/rpc-client";
import { appRouter, createORPCContext } from "@repo/service";
import { COMMON_ERROR_STATUS_MAP, onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { z } from "zod";

// No CORS headers, and none belong here: every client reaches this route
// same-origin. The web app is served from it, the legacy Capacitor app is a
// remote WebView of the production origin (it runs this very bundle), and
// React Native does not enforce CORS.
//
// The session cookie's SameSite=lax (see `sessionCookieOptions` in
// packages/service/src/auth/session-core.ts) covers the cross-SITE half: a forged
// POST from another site reaches the handler carrying no session and does
// nothing. `isCrossOrigin` below covers the rest. CORS headers paired with
// Allow-Credentials would hand a cross-origin page an authenticated path in and
// undo both. GET — the one method a cookie-bearing navigation can reach — is
// not exported, so Next answers 405 before the session is even read. No
// procedure is a GET: the handler's default `allowMethods` would refuse one.
const handler = new RPCHandler(appRouter, {
  clientInterceptors: [
    // oxlint-disable-next-line promise/prefer-await-to-callbacks -- oRPC interceptor, not a node-style callback
    onError((error) => {
      // An ORPCError is a router answering deliberately: an anonymous hit on a
      // protected procedure, a failed sign-in, a duplicate signup email.
      // Everything else is a fault, and this log is the only place its cause —
      // in practice a raw Postgres exception — survives, because oRPC hands the
      // client a generic INTERNAL_SERVER_ERROR in its place.
      if (error instanceof ORPCError) {
        return;
      }
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

const answer = async (req: NextRequest): Promise<Response> => {
  try {
    const context = await createORPCContext({ headers: req.headers });
    const { response } = await handler.handle(req, { context, prefix: "/api/orpc" });

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

const rpcErrorBody = z.looseObject({
  json: z.looseObject({ code: z.string(), defined: z.boolean() }),
});

/**
 * A call without {@link ORPC_CLIENT_HEADER} is an Expo build on oRPC 2.0.0-beta.31,
 * or a tab that loaded the web app before it named its client. That client takes
 * an error body only with `inferable`, which 2.0.0-beta.34 dropped; it was true
 * exactly when the contract declared the code.
 */
const withInferable = async (response: Response): Promise<Response> => {
  if (response.ok) {
    return response;
  }
  const body = rpcErrorBody.safeParse(
    await response
      .clone()
      .json()
      .catch(() => null),
  );
  if (!body.success || "inferable" in body.data.json) {
    return response;
  }
  const headers = new Headers(response.headers);
  headers.delete("content-length");

  return Response.json(
    { ...body.data, json: { ...body.data.json, inferable: body.data.json.defined } },
    { headers, status: response.status },
  );
};

const handleRequest = async (req: NextRequest) => {
  if (isCrossOrigin(req)) {
    return new Response("Cross-origin request blocked.", { status: 403 });
  }

  const response = await answer(req);

  return req.headers.has(ORPC_CLIENT_HEADER) ? response : await withInferable(response);
};

export { handleRequest as POST };

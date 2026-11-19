import type { NextRequest } from "next/server";
import { appRouter, createORPCContext } from "@repo/service";
import { COMMON_ERROR_STATUS_MAP, onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

// WARNING: never add CORS headers: with Allow-Credentials they hand a cross-origin page an authenticated path in.
const handler = new RPCHandler(appRouter, {
  clientInterceptors: [
    // oxlint-disable-next-line promise/prefer-await-to-callbacks -- oRPC interceptor, not a node-style callback
    onError((error) => {
      if (error instanceof ORPCError) {
        return;
      }

      console.error(">>> oRPC Error", error);
    }),
  ],
});

// WARNING: SameSite keys on site, not origin; this Origin check is the only guard against same-site cross-origin form POSTs.
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
    const { response } = await handler.handle(req, { context, prefix: "/api/orpc" });

    return response ?? new Response("Not found", { status: 404 });
  } catch (error) {
    console.error(">>> oRPC Error", error);
    const failure = new ORPCError("INTERNAL_SERVER_ERROR");

    return Response.json(
      { json: failure.toJSON() },
      { status: COMMON_ERROR_STATUS_MAP[failure.code] },
    );
  }
};

export { handleRequest as POST };

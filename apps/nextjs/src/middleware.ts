import type { NextRequest } from "next/server";
import { NextResponse, URLPattern } from "next/server";
import { createMiddlewareClient } from "@repo/db/supabase-middleware-client";

// import { get } from "@vercel/edge-config";

const NEXT_ACTION_HEADER = "next-action";

export const config = {
  matcher: ["/((?!_next/static|_next/image|images|locales|assets|api/*).*)"],
};

export const middleware = async (request: NextRequest) => {
  // const maintenanceMode = await get("maintenance");

  // if (maintenanceMode) {
  //   request.nextUrl.pathname = "/maintenance";
  //   return NextResponse.rewrite(request.nextUrl);
  // }

  const response = NextResponse.next({ request });

  // set a unique request ID for each request
  // this helps us log and trace requests
  request.headers.set("x-correlation-id", crypto.randomUUID());

  // handle patterns for specific routes
  const handlePattern = matchUrlPattern(request.url);

  // if a pattern handler exists, call it
  if (handlePattern) {
    await handlePattern(request, response);
  }

  // append the action path to the request headers
  // which is useful for knowing the action path in server actions
  if (isServerAction(request)) {
    response.headers.set("x-action-path", request.nextUrl.pathname);
  }

  // if no pattern handler returned a response,
  // return the session response
  return response;
};

const isServerAction = (request: NextRequest) => {
  const headers = new Headers(request.headers);

  return headers.has(NEXT_ACTION_HEADER);
};

/**
 * Define URL patterns and their corresponding handlers.
 */
const getPatterns = () => [
  {
    pattern: new URLPattern({ pathname: "/*?" }),
    handler: async (request: NextRequest, response: NextResponse) => {
      const supabase = createMiddlewareClient(request, response);
      await supabase.auth.getUser();
    },
  },
];

/**
 * Match URL patterns to specific handlers.
 * @param url
 */
const matchUrlPattern = (url: string) => {
  const patterns = getPatterns();
  const input = url.split("?")[0];

  for (const pattern of patterns) {
    const patternResult = pattern.pattern.exec(input);

    if (patternResult !== null && "pathname" in patternResult) {
      return pattern.handler;
    }
  }
};

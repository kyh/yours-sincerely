import { NextResponse } from "next/server";

import { negotiateMediaType, withVaryAccept } from "@/lib/agent/accept";
import { resolveMarkdownRoute } from "@/lib/agent/markdown-routes";

import type { NextRequest } from "next/server";

const RSC_MEDIA_TYPE = "text/x-component";

const applyVary = (response: NextResponse) => {
  response.headers.set("Vary", withVaryAccept(response.headers.get("Vary")));

  return response;
};

const isFlightRequest = (request: NextRequest) =>
  (request.headers.get("accept") ?? "").toLowerCase().includes(RSC_MEDIA_TYPE) ||
  request.headers.has("next-action");

export const proxy = (request: NextRequest) => {
  if (isFlightRequest(request)) {
    return applyVary(NextResponse.next());
  }

  const { pathname } = request.nextUrl;
  const chosen = negotiateMediaType(request.headers.get("accept"));

  if (chosen === "text/markdown" && resolveMarkdownRoute(pathname).kind !== "html-only") {
    const url = request.nextUrl.clone();
    url.pathname = `/api/markdown${pathname === "/" ? "" : pathname}`;

    return applyVary(NextResponse.rewrite(url));
  }

  return applyVary(NextResponse.next());
};

/**
 * Only an `Accept` that names markdown invokes the proxy, so ordinary page views
 * never pay for it. Next and Vercel both compile `has` to an anchored,
 * case-sensitive RegExp, hence the per-character case classes.
 */
export const config = {
  matcher: [
    {
      has: [{ key: "accept", type: "header", value: ".*[Mm][Aa][Rr][Kk][Dd][Oo][Ww][Nn].*" }],
      source:
        "/((?!api/|_next/|_vercel/|favicon/|characters/|avatars/|icons/|logo\\.svg$|robots\\.txt$|sitemap\\.xml$|llms\\.txt$|og\\.jpg$).*)",
    },
  ],
};

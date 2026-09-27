import { NextResponse } from "next/server";

import { negotiateMediaType, notAcceptableBody, withVaryAccept } from "@/lib/agent/accept";
import { resolveMarkdownRoute } from "@/lib/agent/markdown-routes";

import type { NextRequest } from "next/server";

/**
 * Markdown content negotiation: one URL, two representations, `Vary: Accept` on
 * both. Server Components always render HTML, so this is the only place a
 * Markdown-preferring request can be rewritten to `/api/markdown/*` before the
 * page renders.
 */

/** `RSC_CONTENT_TYPE_HEADER` in `next/dist/client/components/app-router-headers`. */
const RSC_MEDIA_TYPE = "text/x-component";

/** Next's own RSC vary tokens must survive; a CDN that loses them can hand a flight
    payload to a document request. */
const applyVary = (response: NextResponse): NextResponse => {
  response.headers.set("Vary", withVaryAccept(response.headers.get("Vary")));
  return response;
};

/** React's transport, not a representation of the page: negotiating a Server Action
    or client navigation would answer it 406. */
const isFlightRequest = (request: NextRequest) =>
  (request.headers.get("accept") ?? "").toLowerCase().includes(RSC_MEDIA_TYPE) ||
  request.headers.has("next-action");

export const proxy = (request: NextRequest) => {
  if (isFlightRequest(request)) {
    return applyVary(NextResponse.next());
  }

  const { pathname } = request.nextUrl;
  const accept = request.headers.get("accept");
  const chosen = negotiateMediaType(accept);

  if (chosen === "text/markdown" && resolveMarkdownRoute(pathname).kind !== "html-only") {
    const url = request.nextUrl.clone();
    url.pathname = `/api/markdown${pathname === "/" ? "" : pathname}`;
    return applyVary(NextResponse.rewrite(url));
  }

  if (chosen === null) {
    return new Response(notAcceptableBody(accept), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
        Vary: "Accept",
      },
      status: 406,
    });
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

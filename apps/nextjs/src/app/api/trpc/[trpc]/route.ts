import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { appRouter, createTRPCContext } from "@init/api";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { getDeprecatedSession } from "@/lib/get-deprecated-session";

// export const runtime = "edge";

/**
 * Configure basic CORS headers
 * You should extend this to match your needs
 */
const setCorsHeaders = (res: Response) => {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Request-Method", "*");
  res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.headers.set("Access-Control-Allow-Headers", "*");
};

export const OPTIONS = () => {
  const response = new Response(null, {
    status: 204,
  });

  setCorsHeaders(response);

  return response;
};

const handler = async (req: NextRequest) => {
  const supabase = createRouteHandlerClient({ cookies });
  const userId = getDeprecatedSession();

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () =>
      createTRPCContext({
        headers: req.headers,
        supabase,
        userId,
      }),
    onError: ({ error, path }) => {
      console.error(`>>> tRPC Error on '${path}'`, error);
    },
  });

  setCorsHeaders(response);

  return response;
};

export { handler as GET, handler as POST };

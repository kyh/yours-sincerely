import type { NextRequest } from "next/server";
import { appRouter, createTRPCContext } from "@repo/api";
import { getSession, setSession } from "@repo/api/auth/session";
import { getSupabaseServerClient } from "@repo/db/supabase-server-client";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

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
  // Auto-migrate: If user has Supabase session but no custom session, create one
  // and sign out of Supabase so we don't re-check on every request
  const sessionUserId = await getSession();
  if (!sessionUserId) {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (data.user?.id) {
      await setSession(data.user.id);
      await supabase.auth.signOut();
    }
  }

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () => createTRPCContext({ headers: req.headers }),
    onError: ({ error, path }) => {
      console.error(`>>> tRPC Error on '${path}'`, error);
    },
  });

  setCorsHeaders(response);

  return response;
};

export { handler as GET, handler as POST };

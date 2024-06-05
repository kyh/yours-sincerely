import { cache } from "react";
import { headers } from "next/headers";
import { createCaller, createTRPCContext } from "@init/api";
import { getSupabaseServerClient } from "@init/db/supabase-server-client";

import { getDeprecatedSession } from "@/lib/get-deprecated-session";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const head = new Headers(headers());
  const supabase = getSupabaseServerClient();
  const userId = getDeprecatedSession();

  head.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: head,
    supabase,
    userId,
  });
});

export const api = createCaller(createContext);

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { setSession } from "@repo/api/auth/session";
import { getSupabaseServerClient } from "@repo/db/supabase-server-client";

/**
 * Migrates a Supabase session to a custom session cookie.
 * Called by the proxy when a Supabase cookie exists without a custom session.
 */
export const GET = async (request: NextRequest) => {
  const redirectTo = request.nextUrl.searchParams.get("redirect") ?? "/";

  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user?.id) {
    await setSession(data.user.id);
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
};

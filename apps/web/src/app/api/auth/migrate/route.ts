import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { setSession } from "@repo/api/auth/session";
import { db } from "@repo/db/drizzle-client";
import { getSupabaseServerClient } from "@repo/db/supabase-server-client";

/**
 * Extract user ID from Supabase auth cookie JWT without verifying expiry.
 * The Supabase auth cookie stores a JSON array where the first element is the access token.
 */
const extractUserIdFromSupabaseCookie = (request: NextRequest): string | null => {
  try {
    const authCookie = request.cookies
      .getAll()
      .find((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));

    if (!authCookie) return null;

    const parsed = JSON.parse(authCookie.value) as string[];
    const accessToken = parsed[0];
    if (!accessToken) return null;

    // JWT is base64url encoded: header.payload.signature
    const payloadPart = accessToken.split(".")[1];
    if (!payloadPart) return null;

    const payload = JSON.parse(atob(payloadPart)) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
};

/**
 * Migrates a Supabase session to a custom session cookie.
 * Called by the proxy when a Supabase cookie exists without a custom session.
 */
export const GET = async (request: NextRequest) => {
  const redirectTo = request.nextUrl.searchParams.get("redirect") ?? "/";

  // Extract user ID from Supabase JWT (works even if token is expired)
  const supabaseUserId = extractUserIdFromSupabaseCookie(request);

  if (supabaseUserId) {
    // Verify user exists in our DB before issuing a session
    const existingUser = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, supabaseUserId),
    });

    if (existingUser) {
      await setSession(existingUser.id);
    }

    // Clear Supabase cookies
    const supabase = getSupabaseServerClient();
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
};

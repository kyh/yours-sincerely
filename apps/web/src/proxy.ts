import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "__session";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

const hasSupabaseCookie = (request: NextRequest) => {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));
};

export const proxy = async (request: NextRequest) => {
  // Migrate Supabase session to custom session cookie
  const hasCustomSession = request.cookies.has(SESSION_COOKIE_NAME);

  if (!hasCustomSession && hasSupabaseCookie(request)) {
    const migrateUrl = new URL("/api/auth/migrate", request.url);
    migrateUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(migrateUrl);
  }

  return NextResponse.next({ request });
};

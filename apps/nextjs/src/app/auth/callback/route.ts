import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import { api } from "@/trpc/server";

export const GET = async (request: NextRequest) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  let user;

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);

    const auth = (await supabase.auth.getUser()).data.user;
    user = await api.user.byEmail({ email: auth?.email ?? "" });

    if (!user) {
      user = await api.user.create({
        email: auth?.email ?? "",
        id: auth?.id ?? "",
      });
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(url.origin);
};

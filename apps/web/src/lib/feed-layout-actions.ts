"use server";

import { cookies } from "next/headers";
import { BROWSER_COOKIE_MAX_AGE_SECONDS } from "@repo/contract/auth/auth-schema";
import { nextFeedLayout } from "@repo/contract/client/preferences";

import { FEED_LAYOUT_COOKIE, getFeedLayout } from "./feed-layout";

export const toggleFeedLayout = async () => {
  const cookieStore = await cookies();
  const newFeedLayout = nextFeedLayout(await getFeedLayout());

  cookieStore.set(FEED_LAYOUT_COOKIE, newFeedLayout, {
    maxAge: BROWSER_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
  });
};

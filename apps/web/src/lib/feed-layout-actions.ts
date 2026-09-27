"use server";

import { cookies } from "next/headers";
import { BROWSER_COOKIE_MAX_AGE_SECONDS } from "@repo/contracts/auth";
import { nextFeedLayout } from "@repo/contracts/preferences";

import { FEED_LAYOUT_COOKIE, getFeedLayout } from "./feed-layout";

export const toggleFeedLayout = async () => {
  const cookieStore = await cookies();
  const newFeedLayout = nextFeedLayout(await getFeedLayout());

  // A preference, not a session: without a maxAge the browser drops it on restart.
  cookieStore.set(FEED_LAYOUT_COOKIE, newFeedLayout, {
    maxAge: BROWSER_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
  });
};

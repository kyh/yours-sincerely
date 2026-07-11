"use server";

import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";
import { nextFeedLayout, parseFeedLayout } from "@repo/contracts/preferences";

const feedLayoutKey = "postView";

export type { FeedLayout } from "@repo/contracts/preferences";

export const getFeedLayout = async (cookieStore: ReadonlyRequestCookies) => {
  const feedLayout = cookieStore.get(feedLayoutKey);
  return parseFeedLayout(feedLayout?.value);
};

export const toggleFeedLayout = async () => {
  const cookieStore = await cookies();
  const feedLayout = await getFeedLayout(cookieStore);

  const newFeedLayout = nextFeedLayout(feedLayout);

  cookieStore.set(feedLayoutKey, newFeedLayout);
};

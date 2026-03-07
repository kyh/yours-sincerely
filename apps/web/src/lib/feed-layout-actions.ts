"use server";

import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";

const feedLayoutKey = "postView";

export type FeedLayout = "stack" | "list";

export const getFeedLayout = async (cookieStore: ReadonlyRequestCookies) => {
  const feedLayout = cookieStore.get(feedLayoutKey);
  return (feedLayout?.value as FeedLayout | undefined) ?? "list";
};

export const toggleFeedLayout = async () => {
  const cookieStore = await cookies();
  const feedLayout = await getFeedLayout(cookieStore);

  const newFeedLayout = feedLayout === "list" ? "stack" : "list";

  cookieStore.set(feedLayoutKey, newFeedLayout);
};

import { cookies } from "next/headers";
import { parseFeedLayout } from "@repo/contracts/preferences";

export const FEED_LAYOUT_COOKIE = "postView";

export const getFeedLayout = async () => {
  const cookieStore = await cookies();
  return parseFeedLayout(cookieStore.get(FEED_LAYOUT_COOKIE)?.value);
};

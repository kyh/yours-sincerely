import { createContext, useContext } from "react";
import type { FeedLayout } from "@repo/contracts/preferences";

/** Feed layout preference — mirrors the web `postView` cookie
    (apps/web/src/lib/feed-layout-actions.ts), stored in AsyncStorage. */
export type { FeedLayout } from "@repo/contracts/preferences";

export const FEED_LAYOUT_STORAGE_KEY = "postView";

type FeedLayoutContextValue = {
  layout: FeedLayout;
  toggleLayout: () => void;
};

export const FeedLayoutContext = createContext<FeedLayoutContextValue>({
  layout: "list",
  toggleLayout: () => undefined,
});

export const useFeedLayout = () => useContext(FeedLayoutContext);

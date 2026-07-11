import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { nextFeedLayout, parseFeedLayout } from "@repo/contracts/preferences";

import { FEED_LAYOUT_STORAGE_KEY, FeedLayoutContext, type FeedLayout } from "@/lib/feed-layout";

export const FeedLayoutProvider = ({ children }: { children: ReactNode }) => {
  const [layout, setLayout] = useState<FeedLayout>("list");

  useEffect(() => {
    AsyncStorage.getItem(FEED_LAYOUT_STORAGE_KEY).then((stored) => {
      setLayout(parseFeedLayout(stored ?? undefined));
      return undefined;
    });
  }, []);

  const value = useMemo(
    () => ({
      layout,
      toggleLayout: () => {
        setLayout((current) => {
          const next: FeedLayout = nextFeedLayout(current);
          AsyncStorage.setItem(FEED_LAYOUT_STORAGE_KEY, next).catch(() => undefined);
          return next;
        });
      },
    }),
    [layout],
  );

  return <FeedLayoutContext.Provider value={value}>{children}</FeedLayoutContext.Provider>;
};

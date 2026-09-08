import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { nextFeedLayout, parseFeedLayout } from "@repo/contracts/preferences";

import { FEED_LAYOUT_STORAGE_KEY, FeedLayoutContext } from "@/lib/feed-layout";
import type { FeedLayout } from "@/lib/feed-layout";
import { ignoreRejection } from "@/lib/ignore-rejection";

export const FeedLayoutProvider = ({ children }: { children: ReactNode }) => {
  const [layout, setLayout] = useState<FeedLayout>("list");

  useEffect(() => {
    const restoreLayout = async () => {
      const stored = await AsyncStorage.getItem(FEED_LAYOUT_STORAGE_KEY);
      setLayout(parseFeedLayout(stored ?? undefined));
    };
    void ignoreRejection(restoreLayout());
  }, []);

  const value = useMemo(
    () => ({
      layout,
      toggleLayout: () => {
        setLayout((current) => {
          const next: FeedLayout = nextFeedLayout(current);
          void ignoreRejection(AsyncStorage.setItem(FEED_LAYOUT_STORAGE_KEY, next));
          return next;
        });
      },
    }),
    [layout],
  );

  return <FeedLayoutContext.Provider value={value}>{children}</FeedLayoutContext.Provider>;
};

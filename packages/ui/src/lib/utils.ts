import * as React from "react";

/** Tailwind's `md`, where the page layout gains its sidebar. */
export const DESKTOP_QUERY = "(min-width: 768px)";

export const useMediaQuery = (query: string) => {
  const subscribe = React.useCallback(
    (onStoreChange: () => void) => {
      const result = matchMedia(query);
      result.addEventListener("change", onStoreChange);
      return () => result.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  // The server snapshot is `false` so SSR and hydration agree; the real match
  // takes over on the first commit.
  return React.useSyncExternalStore(
    subscribe,
    () => matchMedia(query).matches,
    () => false,
  );
};

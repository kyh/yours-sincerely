import * as React from "react";

export { cn } from "cn";

export function useMediaQuery(query = "(min-width: 640px)") {
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
}

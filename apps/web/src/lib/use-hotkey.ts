import { useEffect, useRef } from "react";

/**
 * Replaces `@react-hook/hotkey` (unmaintained since 2022) with ~20 lines.
 *
 * The semantics below are a deliberate, faithful reproduction of that library's
 * behavior for the hotkeys this app actually binds — this is a dependency swap,
 * not a behavior change:
 *
 *  - listens for `keydown` on `window`;
 *  - matches on a lowercased `event.key` (its "spacebar" alias is `" "`, and
 *    "left"/"right" are `"arrowleft"`/`"arrowright"`);
 *  - ignores an event that a handler earlier in the chain already consumed
 *    (`defaultPrevented`);
 *  - ignores a keypress carrying any modifier, because none of these hotkeys
 *    declare one (so Cmd+Left etc. stay browser navigation);
 *  - never calls `preventDefault` itself.
 *
 * NOTE: like the library it replaces, this does NOT suppress hotkeys while an
 * input or textarea has focus. See `card-stack.tsx` for why that matters.
 */
export type Hotkey = [key: string, handler: () => void];

const hasModifier = (event: KeyboardEvent) =>
  event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;

export const useHotkeys = (hotkeys: Hotkey[]) => {
  // Hold the latest bindings in a ref so a re-render with fresh handler
  // identities does not tear down and re-attach the listener on every keystroke.
  const hotkeysRef = useRef(hotkeys);
  hotkeysRef.current = hotkeys;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || hasModifier(event)) return;

      const pressed = event.key.toLowerCase();
      for (const [key, handler] of hotkeysRef.current) {
        if (key === pressed) handler();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
};

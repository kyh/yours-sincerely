import { useEffect, useEffectEvent } from "react";

/**
 * Single-key shortcuts on `window`:
 *
 *  - matches on a lowercased `event.key` (space is `" "`, the arrows are
 *    `"arrowleft"`/`"arrowright"`);
 *  - ignores an event that a handler earlier in the chain already consumed
 *    (`defaultPrevented`);
 *  - ignores a keypress carrying any modifier, because none of these hotkeys
 *    declare one (so Cmd+Left etc. stay browser navigation);
 *  - ignores keys typed into an editable field, so a space in the composer is a
 *    space and not "next card";
 *  - never calls `preventDefault` itself.
 */
export type Hotkey = [key: string, handler: () => void];

type HotkeyEvent = Pick<
  KeyboardEvent,
  "altKey" | "ctrlKey" | "defaultPrevented" | "key" | "metaKey" | "shiftKey"
>;

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || target.matches("input, select, textarea"));

const hasModifier = (event: HotkeyEvent) =>
  event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;

export const matchHotkeys = (hotkeys: Hotkey[], event: HotkeyEvent, inEditableField: boolean) => {
  if (event.defaultPrevented || hasModifier(event) || inEditableField) {
    return [];
  }
  const pressed = event.key.toLowerCase();
  return hotkeys.filter(([key]) => key === pressed).map(([, handler]) => handler);
};

export const useHotkeys = (hotkeys: Hotkey[]) => {
  // An Effect Event always sees the latest bindings without becoming a
  // dependency, so a re-render with fresh handler identities does not tear down
  // and re-attach the listener.
  const dispatch = useEffectEvent((event: KeyboardEvent) => {
    for (const handler of matchHotkeys(hotkeys, event, isEditableTarget(event.target))) {
      handler();
    }
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => dispatch(event);

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
};

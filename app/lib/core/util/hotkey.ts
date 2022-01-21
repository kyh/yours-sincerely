import { useHotkeys, Hotkey, HotkeyCallback } from "@react-hook/hotkey";

export const useRootHotkeys = (
  hotkeys: [Hotkey | Hotkey[], HotkeyCallback][]
) => {
  return useHotkeys(typeof window !== "undefined" ? window : null, hotkeys);
};

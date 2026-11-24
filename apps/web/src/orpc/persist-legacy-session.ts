import { Capacitor, CapacitorCookies } from "@capacitor/core";

export const persistLegacySession = async () => {
  if (
    typeof window === "undefined" ||
    Capacitor.getPlatform() !== "android" ||
    !Capacitor.isPluginAvailable("CapacitorCookies")
  ) {
    return;
  }

  try {
    // WARNING: delete only this reserved, unused key; never read or reissue the HttpOnly session (docs/mobile-upgrade-verification.md).
    await CapacitorCookies.deleteCookie({
      key: "__ys_persistence_barrier",
      url: window.location.origin,
    });
  } catch {
    console.warn("Legacy session persistence failed");
  }
};

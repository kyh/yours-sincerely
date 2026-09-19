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
    // Shipped Android codes 1/111 flush the native cookie store before resolving
    // deleteCookie. Delete only this reserved, unused key; never read/reissue the
    // HttpOnly session. See docs/mobile-upgrade-verification.md for binary evidence.
    await CapacitorCookies.deleteCookie({
      key: "__ys_persistence_barrier",
      url: window.location.origin,
    });
  } catch {
    // The server may already have committed a mutation. Do not turn a local
    // persistence failure into an RPC failure that could repeat it.
    console.warn("Legacy session persistence failed");
  }
};

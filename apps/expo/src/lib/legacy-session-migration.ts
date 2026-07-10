import LegacyCookie from "../../modules/legacy-cookie/src/LegacyCookieModule";
import { getSessionCookie, setSessionCookie } from "./session-store";

/** The old Capacitor app was a WebView onto production, so its `__session`
    cookie lives in the native WebView jars for this host. Same bundle id =
    same app container, so the jars survive the store update. */
const HOST = "yourssincerely.org";
const SESSION_COOKIE = "__session";

const migrate = async (): Promise<void> => {
  // Null in builds compiled before the native module existed — nothing to do.
  const legacyCookie = LegacyCookie;
  if (legacyCookie === null) return;

  try {
    if (getSessionCookie() === null) {
      // Keep the value verbatim (still percent-encoded) — the signed cookie
      // must round-trip byte-for-byte, matching api-fetch's decodeValues: false.
      const value = await legacyCookie.read(SESSION_COOKIE, HOST);
      if (value !== null && value.length > 0) {
        setSessionCookie(value);
      }
    }
  } finally {
    // Always drop the legacy jars: RN's own networking stack consults the
    // OS jar behind SecureStore's back, so stale copies cause ghost auth.
    await legacyCookie.clear(HOST).catch(() => undefined);
  }
};

let migration: Promise<void> | null = null;

/** One-shot per cold start; safe to await before every request. */
export const ensureLegacySessionMigrated = (): Promise<void> => {
  migration ??= migrate().catch(() => undefined);
  return migration;
};

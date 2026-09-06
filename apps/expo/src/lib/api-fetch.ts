import { SESSION_COOKIE_NAME as SESSION_COOKIE } from "@repo/contracts/auth";
import { parse, splitCookiesString } from "set-cookie-parser";

import { ensureLegacySessionMigrated } from "./legacy-session-migration";
import { deleteSessionCookie, getSessionCookie, setSessionCookie } from "./session-store";

/**
 * Fetch wrapper that gives React Native a cookie jar for the API's
 * `__session` auth cookie:
 * - outgoing requests carry the stored cookie,
 * - `Set-Cookie` responses update/delete it (RN folds multiple Set-Cookie
 *   headers into one comma-joined string, hence splitCookiesString).
 *
 * Values are kept verbatim (`decodeValues: false`) — the signed value must
 * round-trip byte-for-byte or signature verification fails server-side.
 *
 * `credentials: "omit"` switches off React Native's own cookie handling so
 * SecureStore stays the only source of truth. With it on, iOS appends any
 * cookie in `HTTPCookieStorage.shared` to the explicit header (the server then
 * sees `__session=a,__session=b` and rejects the signature) and Android's
 * OkHttp jar replaces the header outright with whatever the legacy WebView
 * jar still holds — both would let a stale native cookie shadow the stored one.
 */
export const fetchWithSession: typeof fetch = async (input, init) => {
  await ensureLegacySessionMigrated();

  const headers = new Headers(init?.headers);
  const session = getSessionCookie();
  if (session !== null && session.length > 0) {
    headers.set("cookie", `${SESSION_COOKIE}=${session}`);
  }

  const response = await fetch(input, { ...init, headers, credentials: "omit" });

  const rawSetCookie = response.headers.get("set-cookie");
  if (rawSetCookie !== null) {
    const cookies = parse(splitCookiesString(rawSetCookie), { decodeValues: false });
    for (const cookie of cookies) {
      if (cookie.name !== SESSION_COOKIE) continue;
      const expired =
        cookie.maxAge === 0 ||
        (cookie.expires !== undefined && cookie.expires.getTime() <= Date.now());
      if (expired || cookie.value === "") {
        await deleteSessionCookie();
      } else {
        setSessionCookie(cookie.value);
      }
    }
  }

  return response;
};

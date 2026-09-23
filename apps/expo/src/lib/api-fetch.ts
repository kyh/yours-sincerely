import type { AnyProcedure } from "@orpc/server";
import type { AppRouter } from "@repo/api";
import { SESSION_COOKIE_NAME as SESSION_COOKIE } from "@repo/contracts/auth";
import { parse, splitCookiesString } from "set-cookie-parser";

import {
  ensureLegacySessionMigrated,
  retireLegacySessionMigration,
} from "./legacy-session-migration.ts";
import { ignoreRejection } from "./ignore-rejection.ts";
import {
  advanceSessionGeneration,
  deleteSessionCookie,
  getPendingSessionDeletion,
  getSessionCookie,
  getSessionGeneration,
  setSessionCookie,
} from "./session-store.ts";

type ProcedurePath<TRouter> = {
  [K in keyof TRouter & string]: TRouter[K] extends AnyProcedure
    ? K
    : `${K}/${ProcedurePath<TRouter[K]>}`;
}[keyof TRouter & string];

// Checked against the router: a renamed procedure must fail typecheck, not
// silently drop out of the lock and let two anonymous writes mint two users.
const identityProcedurePaths: `/api/orpc/${ProcedurePath<AppRouter>}`[] = [
  "/api/orpc/auth/signInWithPassword",
  "/api/orpc/auth/signUp",
  "/api/orpc/auth/setPassword",
  "/api/orpc/auth/signOut",
  "/api/orpc/auth/signOutEverywhere",
  "/api/orpc/user/deleteUser",
  // These can mint an identity even with a stored, but rejected, cookie.
  "/api/orpc/post/createPost",
  "/api/orpc/like/createLike",
  "/api/orpc/flag/createFlag",
  "/api/orpc/block/createBlock",
];
const identityProcedures = new Set<string>(identityProcedurePaths);

let identityRequests: Promise<void> | null = null;

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
const sendRequest: typeof fetch = async (input, init) => {
  let pendingDeletion = getPendingSessionDeletion();
  while (pendingDeletion !== null) {
    await pendingDeletion;
    pendingDeletion = getPendingSessionDeletion();
  }
  const headers = new Headers(
    init?.headers ?? (input instanceof Request ? input.headers : undefined),
  );
  headers.delete("cookie");
  const session = getSessionCookie();
  const generation = getSessionGeneration();
  if (session !== null && session.length > 0) {
    headers.set("cookie", `${SESSION_COOKIE}=${session}`);
  }

  const response = await fetch(input, { ...init, credentials: "omit", headers });

  const rawSetCookie = response.headers.get("set-cookie");
  if (rawSetCookie !== null && generation === getSessionGeneration()) {
    const cookies = parse(splitCookiesString(rawSetCookie), { decodeValues: false });
    for (const cookie of cookies) {
      if (cookie.name !== SESSION_COOKIE) {
        continue;
      }
      const expired =
        cookie.maxAge === 0 ||
        (cookie.expires !== undefined && cookie.expires.getTime() <= Date.now());
      if (expired || cookie.value === "") {
        await retireLegacySessionMigration();
        if (generation !== getSessionGeneration()) {
          return response;
        }
        await deleteSessionCookie();
      } else {
        setSessionCookie(cookie.value);
      }
    }
  }

  return response;
};

const sendIdentityRequest: typeof fetch = async (input, init) => {
  const previous = identityRequests;
  const performRequest = async () => {
    await previous;
    advanceSessionGeneration();
    try {
      return await sendRequest(input, init);
    } finally {
      advanceSessionGeneration();
    }
  };
  const request = performRequest();
  const completion = ignoreRejection(request);
  identityRequests = completion;
  try {
    return await request;
  } finally {
    if (identityRequests === completion) {
      identityRequests = null;
    }
  }
};

export const fetchWithSession: typeof fetch = async (input, init) => {
  await ensureLegacySessionMigrated();

  const { pathname } = new URL(input instanceof Request ? input.url : input);
  if (identityProcedures.has(pathname)) {
    return await sendIdentityRequest(input, init);
  }

  let pendingIdentity = identityRequests;
  while (pendingIdentity !== null) {
    await pendingIdentity;
    pendingIdentity = identityRequests;
  }
  return await sendRequest(input, init);
};

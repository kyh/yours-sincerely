import type { AnyProcedureContract } from "@orpc/contract";
import type { Contract } from "@repo/contract";
import { SESSION_COOKIE_NAME as SESSION_COOKIE } from "@repo/contract/auth/auth-schema";
import { parseSetCookie } from "set-cookie-parser";
import type { Cookie } from "set-cookie-parser";

import {
  ensureLegacySessionMigrated,
  retireLegacySessionMigration,
} from "./legacy-session-migration.ts";
import { ignoreRejection } from "./ignore-rejection.ts";
import {
  advanceSessionGeneration,
  deleteSessionCookie,
  getSessionCookie,
  getSessionGeneration,
  setSessionCookie,
  waitForSessionDeletion,
} from "./session-store.ts";

type ProcedurePath<TRouter> = {
  [K in keyof TRouter & string]: TRouter[K] extends AnyProcedureContract
    ? K
    : `${K}/${ProcedurePath<TRouter[K]>}`;
}[keyof TRouter & string];

const identityProcedurePaths: `/api/orpc/${ProcedurePath<Contract>}`[] = [
  "/api/orpc/auth/signInWithPassword",
  "/api/orpc/auth/signUp",
  "/api/orpc/auth/setPassword",
  "/api/orpc/auth/signOut",
  "/api/orpc/auth/signOutEverywhere",
  "/api/orpc/user/deleteUser",
  "/api/orpc/post/createPost",
  "/api/orpc/like/createLike",
  "/api/orpc/flag/createFlag",
  "/api/orpc/block/createBlock",
];

const identityProcedures = new Set<string>(identityProcedurePaths);

let identityRequests: Promise<void> | null = null;

const waitForIdentityRequests = async () => {
  const pending = identityRequests;

  if (pending === null) {
    return;
  }

  await pending;
  await waitForIdentityRequests();
};

const applySessionCookies = async (cookies: Cookie[], generation: number) => {
  const [cookie, ...rest] = cookies;

  if (cookie === undefined) {
    return;
  }

  if (cookie.name === SESSION_COOKIE) {
    const expired =
      cookie.maxAge === 0 ||
      (cookie.expires !== undefined && cookie.expires.getTime() <= Date.now());

    if (expired || cookie.value === "") {
      await retireLegacySessionMigration();

      if (generation !== getSessionGeneration()) {
        return;
      }

      await deleteSessionCookie();
    } else {
      setSessionCookie(cookie.value);
    }
  }

  await applySessionCookies(rest, generation);
};

// WARNING: keep credentials "omit" and decodeValues false: native cookie jars would shadow SecureStore, and the signed value must round-trip byte-for-byte.
const sendRequest: typeof fetch = async (input, init) => {
  await waitForSessionDeletion();

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
    await applySessionCookies(
      parseSetCookie(rawSetCookie, { decodeValues: false, split: true }),
      generation,
    );
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

  await waitForIdentityRequests();

  return await sendRequest(input, init);
};

import LegacyCookie from "../../modules/legacy-cookie/src/legacy-cookie-module";
import {
  getLegacySessionMigrationCheckpoint,
  getSessionCookie,
  setLegacySessionMigrationCheckpoint,
  setSessionCookie,
} from "./session-store.ts";
import {
  finalizeLegacySession,
  migrateLegacySession,
  retireLegacySession,
} from "./legacy-session-migration-core.ts";
import type { MigrateLegacySessionResult } from "./legacy-session-migration-core.ts";

/** The old Capacitor app was a WebView onto production, so its `__session`
    cookie lives in the native WebView jars for this host. Same bundle id =
    same app container, so the jars survive the store update.
    Deliberately frozen literals (not imported from contracts): they must
    match what the RETIRED app wrote, even if the live values ever change. */
const HOST = "yourssincerely.org";
const SESSION_COOKIE = "__session";

type MigrationResult = MigrateLegacySessionResult | "unavailable";

const reportFailure = (phase: "copy" | "clear" | "retire", cause: unknown) => {
  const message = cause instanceof Error ? cause.message : "Unknown error";
  console.warn(`[legacy-session-migration] ${phase} failed: ${message}`);
};

let migrationProvenanceEstablished = false;
let migration: Promise<MigrationResult> | null = null;
let finalization: Promise<void> | null = null;
let finalized = false;

const copyLegacySession = async (): Promise<MigrationResult> => {
  // Older development clients may predate the bridge. Store builds must
  // include it: proceeding without it could strand the Capacitor identity.
  const legacyCookie = LegacyCookie;
  if (legacyCookie === null) {
    if (__DEV__) {
      return "unavailable";
    }
    throw new Error("Legacy session migration is unavailable. Rebuild the native app.");
  }

  const { result, legacyProvenance } = await migrateLegacySession({
    getCheckpoint: getLegacySessionMigrationCheckpoint,
    getStored: getSessionCookie,
    // Keep the value verbatim (still percent-encoded) — the signed cookie
    // must round-trip byte-for-byte, matching api-fetch's decodeValues: false.
    readLegacy: () => legacyCookie.read(SESSION_COOKIE, HOST),
    setCheckpoint: setLegacySessionMigrationCheckpoint,
    setStored: setSessionCookie,
  });
  migrationProvenanceEstablished = legacyProvenance;
  return result;
};

/** Share startup work across requests. A failed import blocks requests and
    remains retryable, so a temporary native error cannot replace the identity. */
export const ensureLegacySessionMigrated = (): Promise<MigrationResult> => {
  const attemptMigration = async (): Promise<MigrationResult> => {
    try {
      return await copyLegacySession();
    } catch (error: unknown) {
      migration = null;
      reportFailure("copy", error);
      throw error;
    }
  };
  migration ??= attemptMigration();
  return migration;
};

/** Delete the legacy cookie only after the server accepted a session that is
    also present in SecureStore. Failures remain retryable and never destroy
    the only copy of a user's session. */
export const finalizeLegacySessionMigration = (authenticated: boolean): Promise<void> => {
  const legacyCookie = LegacyCookie;
  if (!authenticated || finalized || legacyCookie === null || !migrationProvenanceEstablished) {
    return Promise.resolve();
  }

  const clearLegacySession = async (): Promise<void> => {
    try {
      const result = await finalizeLegacySession({
        authenticated,
        clearLegacy: () => legacyCookie.clear(SESSION_COOKIE, HOST),
        getCheckpoint: getLegacySessionMigrationCheckpoint,
        getStored: getSessionCookie,
        setCheckpoint: setLegacySessionMigrationCheckpoint,
      });
      if (result === "cleared") {
        finalized = true;
        migrationProvenanceEstablished = false;
      } else {
        finalization = null;
      }
    } catch (error: unknown) {
      finalization = null;
      reportFailure("clear", error);
    }
  };
  finalization ??= clearLegacySession();

  return finalization;
};

/** Call when the user ends their session here (sign-out, account deletion) so
    the legacy jar can never sign them back in on the next cold start. */
export const retireLegacySessionMigration = async (): Promise<void> => {
  const legacyCookie = LegacyCookie;
  if (legacyCookie === null) {
    return;
  }

  try {
    await retireLegacySession({
      clearLegacy: () => legacyCookie.clear(SESSION_COOKIE, HOST),
      getCheckpoint: getLegacySessionMigrationCheckpoint,
      setCheckpoint: setLegacySessionMigrationCheckpoint,
    });
    finalized = true;
    migrationProvenanceEstablished = false;
  } catch (error: unknown) {
    reportFailure("retire", error);
    throw error;
  }
};

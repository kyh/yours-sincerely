import LegacyCookie from "../../modules/legacy-cookie/src/LegacyCookieModule";
import {
  getLegacySessionMigrationCheckpoint,
  getSessionCookie,
  setLegacySessionMigrationCheckpoint,
  setSessionCookie,
} from "./session-store";
import {
  finalizeLegacySession,
  migrateLegacySession,
  type MigrateLegacySessionResult,
} from "./legacy-session-migration-core";

/** The old Capacitor app was a WebView onto production, so its `__session`
    cookie lives in the native WebView jars for this host. Same bundle id =
    same app container, so the jars survive the store update.
    Deliberately frozen literals (not imported from contracts): they must
    match what the RETIRED app wrote, even if the live values ever change. */
const HOST = "yourssincerely.org";
const SESSION_COOKIE = "__session";

type MigrationResult = MigrateLegacySessionResult | "unavailable" | "failed";

const reportFailure = (phase: "copy" | "clear", error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.warn(`[legacy-session-migration] ${phase} failed: ${message}`);
};

let migrationProvenanceEstablished = false;
let migration: Promise<MigrationResult> | null = null;
let finalization: Promise<void> | null = null;
let finalized = false;

/** One-shot per cold start; safe to await before every request. */
export const ensureLegacySessionMigrated = (): Promise<MigrationResult> => {
  migration ??= (async (): Promise<MigrationResult> => {
    // Null in builds compiled before the native module existed — nothing to do.
    const legacyCookie = LegacyCookie;
    if (legacyCookie === null) return "unavailable";

    const { result, legacyProvenance } = await migrateLegacySession({
      getStored: getSessionCookie,
      setStored: setSessionCookie,
      // Keep the value verbatim (still percent-encoded) — the signed cookie
      // must round-trip byte-for-byte, matching api-fetch's decodeValues: false.
      readLegacy: () => legacyCookie.read(SESSION_COOKIE, HOST),
      getCheckpoint: getLegacySessionMigrationCheckpoint,
      setCheckpoint: setLegacySessionMigrationCheckpoint,
    });
    migrationProvenanceEstablished = legacyProvenance;
    return result;
  })().catch((error: unknown) => {
    reportFailure("copy", error);
    return "failed";
  });
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

  finalization ??= finalizeLegacySession({
    authenticated,
    getStored: getSessionCookie,
    getCheckpoint: getLegacySessionMigrationCheckpoint,
    setCheckpoint: setLegacySessionMigrationCheckpoint,
    clearLegacy: () => legacyCookie.clear(SESSION_COOKIE, HOST),
  })
    .then((result) => {
      if (result === "cleared") {
        finalized = true;
        migrationProvenanceEstablished = false;
      } else {
        finalization = null;
      }
      return undefined;
    })
    .catch((error: unknown) => {
      finalization = null;
      reportFailure("clear", error);
    });

  return finalization;
};

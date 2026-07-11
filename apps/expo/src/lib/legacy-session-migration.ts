import LegacyCookie from "../../modules/legacy-cookie/src/LegacyCookieModule";
import {
  getLegacySessionMigrationCheckpoint,
  getSessionCookie,
  setLegacySessionMigrationCheckpoint,
  setSessionCookie,
} from "./session-store";
import {
  copyLegacySession,
  finalizeLegacySession,
  type CopyLegacySessionResult,
} from "./legacy-session-migration-core";

/** The old Capacitor app was a WebView onto production, so its `__session`
    cookie lives in the native WebView jars for this host. Same bundle id =
    same app container, so the jars survive the store update. */
const HOST = "yourssincerely.org";
const SESSION_COOKIE = "__session";
let migrationProvenanceEstablished = false;

type MigrationResult =
  | CopyLegacySessionResult
  | "cleanup-pending"
  | "complete"
  | "unavailable"
  | "failed";

const reportFailure = (phase: "copy" | "clear", error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.warn(`[legacy-session-migration] ${phase} failed: ${message}`);
};

const migrate = async (): Promise<MigrationResult> => {
  const checkpoint = getLegacySessionMigrationCheckpoint();
  if (checkpoint === "complete") return "complete";

  // Null in builds compiled before the native module existed — nothing to do.
  const legacyCookie = LegacyCookie;
  if (legacyCookie === null) return "unavailable";

  const stored = getSessionCookie();
  if (checkpoint === "cleanup-pending" && stored !== null && stored.length > 0) {
    migrationProvenanceEstablished = true;
    return "cleanup-pending";
  }

  // Recover the narrow crash window between persisting the copied cookie and
  // checkpointing it. Exact equality proves this stored value came from the
  // legacy jar without treating an unrelated native session as migratable.
  if (checkpoint === null && stored !== null && stored.length > 0) {
    const legacy = await legacyCookie.read(SESSION_COOKIE, HOST);
    if (legacy !== null && legacy.length > 0 && legacy === stored) {
      setLegacySessionMigrationCheckpoint("cleanup-pending");
      if (getLegacySessionMigrationCheckpoint() !== "cleanup-pending") {
        throw new Error("The migration cleanup checkpoint could not be verified");
      }
      migrationProvenanceEstablished = true;
      return "cleanup-pending";
    }
    return "already-stored";
  }

  const result = await copyLegacySession({
    getStored: getSessionCookie,
    setStored: setSessionCookie,
    // Keep the value verbatim (still percent-encoded) — the signed cookie
    // must round-trip byte-for-byte, matching api-fetch's decodeValues: false.
    readLegacy: () => legacyCookie.read(SESSION_COOKIE, HOST),
  });
  if (result === "copied") {
    setLegacySessionMigrationCheckpoint("cleanup-pending");
    if (getLegacySessionMigrationCheckpoint() !== "cleanup-pending") {
      throw new Error("The migration cleanup checkpoint could not be verified");
    }
    migrationProvenanceEstablished = true;
  }
  return result;
};

let migration: Promise<MigrationResult> | null = null;
let finalization: Promise<void> | null = null;
let finalized = false;

/** One-shot per cold start; safe to await before every request. */
export const ensureLegacySessionMigrated = (): Promise<MigrationResult> => {
  migration ??= migrate().catch((error: unknown) => {
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

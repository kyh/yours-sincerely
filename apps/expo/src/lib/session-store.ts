import * as SecureStore from "expo-secure-store";

import type { LegacySessionMigrationCheckpoint } from "./legacy-session-migration-core.ts";

/** Holds the raw signed `__session` cookie value issued by the API
    (see packages/api/src/auth/session.ts). SecureStore is the single
    source of truth — the native cookie jar is never consulted. */
const SESSION_KEY = "session-cookie";
const LEGACY_MIGRATION_CHECKPOINT_KEY = "legacy-session-migration-complete";

// Requests from a previous identity must never restore their response cookie.
let sessionGeneration = 0;
export const getSessionGeneration = () => sessionGeneration;
export const advanceSessionGeneration = () => {
  sessionGeneration += 1;
};

// Keep only a failed write for retry. It is never sent until SecureStore
// confirms it, so a transient write error cannot mint another anonymous user.
let pendingSessionWrite: string | null = null;
let pendingSessionDeletion: Promise<void> | null = null;
export const getPendingSessionDeletion = () => pendingSessionDeletion;

const persistPendingSession = () => {
  const value = pendingSessionWrite;
  if (value === null) {
    return;
  }
  SecureStore.setItem(SESSION_KEY, value);
  if (SecureStore.getItem(SESSION_KEY) !== value) {
    throw new Error("The session could not be verified in secure storage");
  }
  pendingSessionWrite = null;
};

export const getSessionCookie = () => {
  persistPendingSession();
  return SecureStore.getItem(SESSION_KEY);
};

export const setSessionCookie = (value: string) => {
  pendingSessionWrite = value;
  persistPendingSession();
};

const removeCookie = async () => {
  await SecureStore.deleteItemAsync(SESSION_KEY);
  if (getSessionCookie() !== null) {
    throw new Error("The session could not be removed from secure storage");
  }
};

export const deleteSessionCookie = (): Promise<void> => {
  if (pendingSessionDeletion !== null) {
    return pendingSessionDeletion;
  }
  const finishDeletion = async () => {
    advanceSessionGeneration();
    pendingSessionWrite = null;
    try {
      await removeCookie();
    } finally {
      advanceSessionGeneration();
      pendingSessionDeletion = null;
    }
  };
  pendingSessionDeletion = finishDeletion();
  return pendingSessionDeletion;
};

export const getLegacySessionMigrationCheckpoint = (): LegacySessionMigrationCheckpoint => {
  const checkpoint = SecureStore.getItem(LEGACY_MIGRATION_CHECKPOINT_KEY);
  return checkpoint === "cleanup-pending" || checkpoint === "complete" ? checkpoint : null;
};

export const setLegacySessionMigrationCheckpoint = (
  checkpoint: Exclude<LegacySessionMigrationCheckpoint, null>,
) => {
  SecureStore.setItem(LEGACY_MIGRATION_CHECKPOINT_KEY, checkpoint);
};

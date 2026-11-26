import * as SecureStore from "expo-secure-store";

import type { LegacySessionMigrationCheckpoint } from "./legacy-session-migration-core.ts";

const SESSION_KEY = "session-cookie";
const LEGACY_MIGRATION_CHECKPOINT_KEY = "legacy-session-migration-complete";

let sessionGeneration = 0;
export const getSessionGeneration = () => sessionGeneration;

export const advanceSessionGeneration = () => {
  sessionGeneration += 1;
};

let pendingSessionWrite: string | null = null;
let pendingSessionDeletion: Promise<void> | null = null;

/** Resolves once no cookie deletion is in flight, including ones that start while waiting. */
export const waitForSessionDeletion = async () => {
  const pending = pendingSessionDeletion;

  if (pending === null) {
    return;
  }

  await pending;
  await waitForSessionDeletion();
};

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

export const deleteSessionCookie = async () => {
  if (pendingSessionDeletion !== null) {
    await pendingSessionDeletion;

    return;
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

  await pendingSessionDeletion;
};

export const getLegacySessionMigrationCheckpoint: () => LegacySessionMigrationCheckpoint = () => {
  const checkpoint = SecureStore.getItem(LEGACY_MIGRATION_CHECKPOINT_KEY);

  return checkpoint === "cleanup-pending" || checkpoint === "complete" ? checkpoint : null;
};

export const setLegacySessionMigrationCheckpoint = (
  checkpoint: Exclude<LegacySessionMigrationCheckpoint, null>,
) => {
  SecureStore.setItem(LEGACY_MIGRATION_CHECKPOINT_KEY, checkpoint);
};

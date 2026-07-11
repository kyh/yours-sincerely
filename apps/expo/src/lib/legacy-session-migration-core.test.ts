import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  copyLegacySession,
  finalizeLegacySession,
  migrateLegacySession,
  type LegacySessionMigrationCheckpoint,
} from "./legacy-session-migration-core.ts";

/** In-memory stand-ins for SecureStore + the native cookie module. */
const createMigrationHarness = (initial: {
  stored?: string | null;
  legacy?: string | null;
  checkpoint?: LegacySessionMigrationCheckpoint;
}) => {
  let stored = initial.stored ?? null;
  let checkpoint = initial.checkpoint ?? null;
  let readCount = 0;

  return {
    get stored() {
      return stored;
    },
    get checkpoint() {
      return checkpoint;
    },
    get readCount() {
      return readCount;
    },
    deps: {
      getStored: () => stored,
      setStored: (value: string) => {
        stored = value;
      },
      readLegacy: () => {
        readCount += 1;
        return Promise.resolve(initial.legacy ?? null);
      },
      getCheckpoint: () => checkpoint,
      setCheckpoint: (value: Exclude<LegacySessionMigrationCheckpoint, null>) => {
        checkpoint = value;
      },
    },
  };
};

describe("copyLegacySession", () => {
  it("copies the legacy cookie byte-for-byte without clearing it", async () => {
    let stored: string | null = null;
    let clearCount = 0;
    const legacy = "signed%2Evalue%3D%3D";

    const result = await copyLegacySession({
      getStored: () => stored,
      setStored: (value) => {
        stored = value;
      },
      readLegacy: () => Promise.resolve(legacy),
    });

    assert.equal(result, "copied");
    assert.equal(stored, legacy);
    assert.equal(clearCount, 0);
  });

  it("leaves the legacy jar intact when no cookie is visible", async () => {
    let stored: string | null = null;

    const result = await copyLegacySession({
      getStored: () => stored,
      setStored: (value) => {
        stored = value;
      },
      readLegacy: () => Promise.resolve(null),
    });

    assert.equal(result, "absent");
    assert.equal(stored, null);
  });

  it("leaves the legacy jar intact when persistence fails", async () => {
    await assert.rejects(
      copyLegacySession({
        getStored: () => null,
        setStored: () => {
          throw new Error("keychain unavailable");
        },
        readLegacy: () => Promise.resolve("legacy"),
      }),
      /keychain unavailable/,
    );
  });

  it("rejects when the persisted value cannot be verified", async () => {
    await assert.rejects(
      copyLegacySession({
        getStored: () => null,
        setStored: () => undefined,
        readLegacy: () => Promise.resolve("legacy"),
      }),
      /could not be verified/,
    );
  });

  it("does not re-read when a stored session already exists", async () => {
    let readCount = 0;

    const result = await copyLegacySession({
      getStored: () => "stored",
      setStored: () => undefined,
      readLegacy: () => {
        readCount += 1;
        return Promise.resolve("legacy");
      },
    });

    assert.equal(result, "already-stored");
    assert.equal(readCount, 0);
  });
});

describe("migrateLegacySession", () => {
  it("copies a legacy cookie on first launch and marks cleanup pending", async () => {
    const harness = createMigrationHarness({ legacy: "signed%2Evalue" });

    const outcome = await migrateLegacySession(harness.deps);

    assert.deepEqual(outcome, { result: "copied", legacyProvenance: true });
    assert.equal(harness.stored, "signed%2Evalue");
    assert.equal(harness.checkpoint, "cleanup-pending");
  });

  it("short-circuits without a native read once migration is complete", async () => {
    const harness = createMigrationHarness({ stored: "session", checkpoint: "complete" });

    const outcome = await migrateLegacySession(harness.deps);

    assert.deepEqual(outcome, { result: "complete", legacyProvenance: false });
    assert.equal(harness.readCount, 0);
  });

  it("re-establishes provenance for a pending cleanup without a native read", async () => {
    const harness = createMigrationHarness({ stored: "session", checkpoint: "cleanup-pending" });

    const outcome = await migrateLegacySession(harness.deps);

    assert.deepEqual(outcome, { result: "cleanup-pending", legacyProvenance: true });
    assert.equal(harness.readCount, 0);
  });

  it("recovers a crash between persisting the copy and checkpointing it", async () => {
    const harness = createMigrationHarness({ stored: "copied-value", legacy: "copied-value" });

    const outcome = await migrateLegacySession(harness.deps);

    assert.deepEqual(outcome, { result: "cleanup-pending", legacyProvenance: true });
    assert.equal(harness.checkpoint, "cleanup-pending");
  });

  it("reaches the terminal state for sessions that never came from the legacy jar", async () => {
    const harness = createMigrationHarness({ stored: "fresh-signup" });

    const first = await migrateLegacySession(harness.deps);
    assert.deepEqual(first, { result: "already-stored", legacyProvenance: false });
    assert.equal(harness.checkpoint, "complete");
    assert.equal(harness.readCount, 1);

    // The next cold start must not pay for another native read.
    const second = await migrateLegacySession(harness.deps);
    assert.deepEqual(second, { result: "complete", legacyProvenance: false });
    assert.equal(harness.readCount, 1);
  });

  it("stays retryable on a signed-out fresh install with no legacy cookie", async () => {
    const harness = createMigrationHarness({});

    const outcome = await migrateLegacySession(harness.deps);

    // No checkpoint: a transient empty jar must never be mistaken for terminal.
    assert.deepEqual(outcome, { result: "absent", legacyProvenance: false });
    assert.equal(harness.checkpoint, null);
    assert.equal(harness.stored, null);
  });

  it("rejects when a checkpoint write cannot be verified", async () => {
    const harness = createMigrationHarness({ legacy: "signed%2Evalue" });

    await assert.rejects(
      migrateLegacySession({
        ...harness.deps,
        setCheckpoint: () => undefined,
      }),
      /checkpoint could not be verified/,
    );
  });
});

describe("finalizeLegacySession", () => {
  it("clears only after server auth, a stored successor, and a pending checkpoint", async () => {
    let clearCount = 0;
    let checkpoint: "cleanup-pending" | "complete" | null = "cleanup-pending";
    const clearLegacy = () => {
      clearCount += 1;
      return Promise.resolve();
    };

    assert.equal(
      await finalizeLegacySession({
        authenticated: false,
        getStored: () => "stored",
        getCheckpoint: () => checkpoint,
        setCheckpoint: (value) => {
          checkpoint = value;
        },
        clearLegacy,
      }),
      "deferred",
    );
    assert.equal(
      await finalizeLegacySession({
        authenticated: true,
        getStored: () => null,
        getCheckpoint: () => checkpoint,
        setCheckpoint: (value) => {
          checkpoint = value;
        },
        clearLegacy,
      }),
      "deferred",
    );
    assert.equal(
      await finalizeLegacySession({
        authenticated: true,
        // The server may renew the copied legacy cookie before finalization.
        getStored: () => "new-session",
        getCheckpoint: () => null,
        setCheckpoint: (value) => {
          checkpoint = value;
        },
        clearLegacy,
      }),
      "deferred",
    );
    assert.equal(clearCount, 0);

    assert.equal(
      await finalizeLegacySession({
        authenticated: true,
        getStored: () => "renewed-session",
        getCheckpoint: () => checkpoint,
        setCheckpoint: (value) => {
          checkpoint = value;
        },
        clearLegacy,
      }),
      "cleared",
    );
    assert.equal(clearCount, 1);
    assert.equal(checkpoint, "complete");
  });

  it("leaves cleanup pending when native clearing fails, then retries", async () => {
    let clearCount = 0;
    let checkpoint: "cleanup-pending" | "complete" | null = "cleanup-pending";

    await assert.rejects(
      finalizeLegacySession({
        authenticated: true,
        getStored: () => "renewed-session",
        getCheckpoint: () => checkpoint,
        setCheckpoint: (value) => {
          checkpoint = value;
        },
        clearLegacy: () => {
          clearCount += 1;
          return Promise.reject(new Error("native clear failed"));
        },
      }),
      /native clear failed/,
    );
    assert.equal(checkpoint, "cleanup-pending");
    assert.equal(clearCount, 1);

    assert.equal(
      await finalizeLegacySession({
        authenticated: true,
        getStored: () => "renewed-session",
        getCheckpoint: () => checkpoint,
        setCheckpoint: (value) => {
          checkpoint = value;
        },
        clearLegacy: () => {
          clearCount += 1;
          return Promise.resolve();
        },
      }),
      "cleared",
    );
    assert.equal(checkpoint, "complete");
    assert.equal(clearCount, 2);
  });

  it("rejects when the completion checkpoint cannot be verified", async () => {
    await assert.rejects(
      finalizeLegacySession({
        authenticated: true,
        getStored: () => "stored",
        getCheckpoint: () => "cleanup-pending",
        setCheckpoint: () => undefined,
        clearLegacy: () => Promise.resolve(),
      }),
      /checkpoint could not be verified/,
    );
  });
});

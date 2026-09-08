import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  copyLegacySession,
  finalizeLegacySession,
  migrateLegacySession,
  retireLegacySession,
} from "./legacy-session-migration-core.ts";
import type { LegacySessionMigrationCheckpoint } from "./legacy-session-migration-core.ts";

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
    get checkpoint() {
      return checkpoint;
    },
    deps: {
      getCheckpoint: () => checkpoint,
      getStored: () => stored,
      readLegacy: () => {
        readCount += 1;
        return Promise.resolve(initial.legacy ?? null);
      },
      setCheckpoint: (value: Exclude<LegacySessionMigrationCheckpoint, null>) => {
        checkpoint = value;
      },
      setStored: (value: string) => {
        stored = value;
      },
    },
    get readCount() {
      return readCount;
    },
    get stored() {
      return stored;
    },
  };
};

describe("copyLegacySession", () => {
  it("copies the legacy cookie byte-for-byte without clearing it", async () => {
    let stored: string | null = null;
    const clearCount = 0;
    const legacy = "signed%2Evalue%3D%3D";

    const result = await copyLegacySession({
      getStored: () => stored,
      readLegacy: () => Promise.resolve(legacy),
      setStored: (value) => {
        stored = value;
      },
    });

    assert.equal(result, "copied");
    assert.equal(stored, legacy);
    assert.equal(clearCount, 0);
  });

  it("leaves the legacy jar intact when no cookie is visible", async () => {
    let stored: string | null = null;

    const result = await copyLegacySession({
      getStored: () => stored,
      readLegacy: () => Promise.resolve(null),
      setStored: (value) => {
        stored = value;
      },
    });

    assert.equal(result, "absent");
    assert.equal(stored, null);
  });

  it("leaves the legacy jar intact when persistence fails", async () => {
    await assert.rejects(
      copyLegacySession({
        getStored: () => null,
        readLegacy: () => Promise.resolve("legacy"),
        setStored: () => {
          throw new Error("keychain unavailable");
        },
      }),
      /keychain unavailable/u,
    );
  });

  it("rejects when the persisted value cannot be verified", async () => {
    await assert.rejects(
      copyLegacySession({
        getStored: () => null,
        readLegacy: () => Promise.resolve("legacy"),
        setStored: () => {},
      }),
      /could not be verified/u,
    );
  });

  it("does not re-read when a stored session already exists", async () => {
    let readCount = 0;

    const result = await copyLegacySession({
      getStored: () => "stored",
      readLegacy: () => {
        readCount += 1;
        return Promise.resolve("legacy");
      },
      setStored: () => {},
    });

    assert.equal(result, "already-stored");
    assert.equal(readCount, 0);
  });
});

describe("migrateLegacySession", () => {
  it("copies a legacy cookie on first launch and marks cleanup pending", async () => {
    const harness = createMigrationHarness({ legacy: "signed%2Evalue" });

    const outcome = await migrateLegacySession(harness.deps);

    assert.deepEqual(outcome, { legacyProvenance: true, result: "copied" });
    assert.equal(harness.stored, "signed%2Evalue");
    assert.equal(harness.checkpoint, "cleanup-pending");
  });

  it("short-circuits without a native read once migration is complete", async () => {
    const harness = createMigrationHarness({ checkpoint: "complete", stored: "session" });

    const outcome = await migrateLegacySession(harness.deps);

    assert.deepEqual(outcome, { legacyProvenance: false, result: "complete" });
    assert.equal(harness.readCount, 0);
  });

  it("re-establishes provenance for a pending cleanup without a native read", async () => {
    const harness = createMigrationHarness({ checkpoint: "cleanup-pending", stored: "session" });

    const outcome = await migrateLegacySession(harness.deps);

    assert.deepEqual(outcome, { legacyProvenance: true, result: "cleanup-pending" });
    assert.equal(harness.readCount, 0);
  });

  it("recovers a crash between persisting the copy and checkpointing it", async () => {
    const harness = createMigrationHarness({ legacy: "copied-value", stored: "copied-value" });

    const outcome = await migrateLegacySession(harness.deps);

    assert.deepEqual(outcome, { legacyProvenance: true, result: "cleanup-pending" });
    assert.equal(harness.checkpoint, "cleanup-pending");
  });

  it("reaches the terminal state for sessions that never came from the legacy jar", async () => {
    const harness = createMigrationHarness({ stored: "fresh-signup" });

    const first = await migrateLegacySession(harness.deps);
    assert.deepEqual(first, { legacyProvenance: false, result: "already-stored" });
    assert.equal(harness.checkpoint, "complete");
    assert.equal(harness.readCount, 1);

    // The next cold start must not pay for another native read.
    const second = await migrateLegacySession(harness.deps);
    assert.deepEqual(second, { legacyProvenance: false, result: "complete" });
    assert.equal(harness.readCount, 1);
  });

  it("stays retryable on a signed-out fresh install with no legacy cookie", async () => {
    const harness = createMigrationHarness({});

    const outcome = await migrateLegacySession(harness.deps);

    // No checkpoint: a transient empty jar must never be mistaken for terminal.
    assert.deepEqual(outcome, { legacyProvenance: false, result: "absent" });
    assert.equal(harness.checkpoint, null);
    assert.equal(harness.stored, null);
  });

  it("rejects when a checkpoint write cannot be verified", async () => {
    const harness = createMigrationHarness({ legacy: "signed%2Evalue" });

    await assert.rejects(
      migrateLegacySession({
        ...harness.deps,
        setCheckpoint: () => {},
      }),
      /checkpoint could not be verified/u,
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
        clearLegacy,
        getCheckpoint: () => checkpoint,
        getStored: () => "stored",
        setCheckpoint: (value) => {
          checkpoint = value;
        },
      }),
      "deferred",
    );
    assert.equal(
      await finalizeLegacySession({
        authenticated: true,
        clearLegacy,
        getCheckpoint: () => checkpoint,
        getStored: () => null,
        setCheckpoint: (value) => {
          checkpoint = value;
        },
      }),
      "deferred",
    );
    assert.equal(
      await finalizeLegacySession({
        authenticated: true,
        clearLegacy,
        getCheckpoint: () => null,
        // The server may renew the copied legacy cookie before finalization.
        getStored: () => "new-session",
        setCheckpoint: (value) => {
          checkpoint = value;
        },
      }),
      "deferred",
    );
    assert.equal(clearCount, 0);

    assert.equal(
      await finalizeLegacySession({
        authenticated: true,
        clearLegacy,
        getCheckpoint: () => checkpoint,
        getStored: () => "renewed-session",
        setCheckpoint: (value) => {
          checkpoint = value;
        },
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
        clearLegacy: () => {
          clearCount += 1;
          return Promise.reject(new Error("native clear failed"));
        },
        getCheckpoint: () => checkpoint,
        getStored: () => "renewed-session",
        setCheckpoint: (value) => {
          checkpoint = value;
        },
      }),
      /native clear failed/u,
    );
    assert.equal(checkpoint, "cleanup-pending");
    assert.equal(clearCount, 1);

    assert.equal(
      await finalizeLegacySession({
        authenticated: true,
        clearLegacy: () => {
          clearCount += 1;
          return Promise.resolve();
        },
        getCheckpoint: () => checkpoint,
        getStored: () => "renewed-session",
        setCheckpoint: (value) => {
          checkpoint = value;
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
        clearLegacy: () => Promise.resolve(),
        getCheckpoint: () => "cleanup-pending",
        getStored: () => "stored",
        setCheckpoint: () => {},
      }),
      /checkpoint could not be verified/u,
    );
  });
});

describe("retireLegacySession", () => {
  it("clears the jar and reaches the terminal checkpoint so a cold start cannot re-copy", async () => {
    const harness = createMigrationHarness({
      checkpoint: "cleanup-pending",
      legacy: "legacy",
      stored: null,
    });
    let clearCount = 0;

    assert.equal(
      await retireLegacySession({
        ...harness.deps,
        clearLegacy: () => {
          clearCount += 1;
          return Promise.resolve();
        },
      }),
      "retired",
    );
    assert.equal(clearCount, 1);
    assert.equal(harness.checkpoint, "complete");

    const { result } = await migrateLegacySession(harness.deps);
    assert.equal(result, "complete");
    assert.equal(harness.stored, null);
    assert.equal(harness.readCount, 0);
  });

  it("still reaches the terminal checkpoint when native clearing fails", async () => {
    const harness = createMigrationHarness({ checkpoint: null, legacy: "legacy" });

    assert.equal(
      await retireLegacySession({
        ...harness.deps,
        clearLegacy: () => Promise.reject(new Error("jar locked")),
      }),
      "retired",
    );
    assert.equal(harness.checkpoint, "complete");
  });

  it("skips the native call once migration is already complete", async () => {
    const harness = createMigrationHarness({ checkpoint: "complete" });
    let clearCount = 0;

    assert.equal(
      await retireLegacySession({
        ...harness.deps,
        clearLegacy: () => {
          clearCount += 1;
          return Promise.resolve();
        },
      }),
      "already-complete",
    );
    assert.equal(clearCount, 0);
  });

  it("rejects when the completion checkpoint cannot be verified", async () => {
    await assert.rejects(
      retireLegacySession({
        clearLegacy: () => Promise.resolve(),
        getCheckpoint: () => null,
        setCheckpoint: () => {},
      }),
      /checkpoint could not be verified/u,
    );
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { copyLegacySession, finalizeLegacySession } from "./legacy-session-migration-core.ts";

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

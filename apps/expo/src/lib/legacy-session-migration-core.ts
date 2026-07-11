export type CopyLegacySessionResult = "already-stored" | "copied" | "absent";
export type LegacySessionMigrationCheckpoint = "cleanup-pending" | "complete" | null;

type CopyLegacySessionDependencies = {
  getStored: () => string | null;
  setStored: (value: string) => void;
  readLegacy: () => Promise<string | null>;
};

type FinalizeLegacySessionDependencies = {
  authenticated: boolean;
  getStored: () => string | null;
  getCheckpoint: () => LegacySessionMigrationCheckpoint;
  setCheckpoint: (checkpoint: Exclude<LegacySessionMigrationCheckpoint, null>) => void;
  clearLegacy: () => Promise<void>;
};

export type MigrateLegacySessionResult = CopyLegacySessionResult | "cleanup-pending" | "complete";

type MigrateLegacySessionDependencies = CopyLegacySessionDependencies & {
  getCheckpoint: () => LegacySessionMigrationCheckpoint;
  setCheckpoint: (checkpoint: Exclude<LegacySessionMigrationCheckpoint, null>) => void;
};

const isPresent = (value: string | null): value is string => value !== null && value.length > 0;

const setCheckpointVerified = (
  {
    getCheckpoint,
    setCheckpoint,
  }: Pick<MigrateLegacySessionDependencies, "getCheckpoint" | "setCheckpoint">,
  checkpoint: Exclude<LegacySessionMigrationCheckpoint, null>,
) => {
  setCheckpoint(checkpoint);
  if (getCheckpoint() !== checkpoint) {
    throw new Error(`The migration ${checkpoint} checkpoint could not be verified`);
  }
};

export const copyLegacySession = async ({
  getStored,
  setStored,
  readLegacy,
}: CopyLegacySessionDependencies): Promise<CopyLegacySessionResult> => {
  if (isPresent(getStored())) return "already-stored";

  const legacy = await readLegacy();
  if (!isPresent(legacy)) return "absent";

  setStored(legacy);
  if (getStored() !== legacy) {
    throw new Error("The migrated session could not be verified in secure storage");
  }

  return "copied";
};

/** Runs once per cold start. Returns whether the stored session's provenance
    is the legacy jar — only then may finalization later clear that jar. */
export const migrateLegacySession = async (
  deps: MigrateLegacySessionDependencies,
): Promise<{ result: MigrateLegacySessionResult; legacyProvenance: boolean }> => {
  const { getStored, setStored, readLegacy, getCheckpoint } = deps;

  if (getCheckpoint() === "complete") return { result: "complete", legacyProvenance: false };

  const stored = getStored();
  if (getCheckpoint() === "cleanup-pending" && isPresent(stored)) {
    return { result: "cleanup-pending", legacyProvenance: true };
  }

  if (getCheckpoint() === null && isPresent(stored)) {
    // Recover the narrow crash window between persisting the copied cookie and
    // checkpointing it. Exact equality proves this stored value came from the
    // legacy jar without treating an unrelated native session as migratable.
    const legacy = await readLegacy();
    if (isPresent(legacy) && legacy === stored) {
      setCheckpointVerified(deps, "cleanup-pending");
      return { result: "cleanup-pending", legacyProvenance: true };
    }
    // The stored session provably did not come from the legacy jar (e.g. a
    // sign-up on this app), so there is nothing to migrate now or ever —
    // reach the terminal state so cold starts stop paying for a native read.
    setCheckpointVerified(deps, "complete");
    return { result: "already-stored", legacyProvenance: false };
  }

  const result = await copyLegacySession({ getStored, setStored, readLegacy });
  if (result === "copied") setCheckpointVerified(deps, "cleanup-pending");
  return { result, legacyProvenance: result === "copied" };
};

export const finalizeLegacySession = async ({
  authenticated,
  getStored,
  getCheckpoint,
  setCheckpoint,
  clearLegacy,
}: FinalizeLegacySessionDependencies): Promise<"cleared" | "deferred"> => {
  if (!authenticated || !isPresent(getStored()) || getCheckpoint() !== "cleanup-pending") {
    return "deferred";
  }

  await clearLegacy();

  setCheckpointVerified({ getCheckpoint, setCheckpoint }, "complete");

  return "cleared";
};

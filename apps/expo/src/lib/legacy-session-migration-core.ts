export type CopyLegacySessionResult = "already-stored" | "copied" | "absent";

export type LegacySessionMigrationCheckpoint = "cleanup-pending" | "complete" | null;

interface CopyLegacySessionDependencies {
  getStored: () => string | null;
  setStored: (value: string) => void;
  readLegacy: () => Promise<string | null>;
}

interface FinalizeLegacySessionDependencies {
  authenticated: boolean;
  getStored: () => string | null;
  getCheckpoint: () => LegacySessionMigrationCheckpoint;
  setCheckpoint: (checkpoint: Exclude<LegacySessionMigrationCheckpoint, null>) => void;
  clearLegacy: () => Promise<void>;
}

export type MigrateLegacySessionResult = CopyLegacySessionResult | "cleanup-pending" | "complete";

type MigrateLegacySessionDependencies = CopyLegacySessionDependencies & {
  getCheckpoint: () => LegacySessionMigrationCheckpoint;
  setCheckpoint: (checkpoint: Exclude<LegacySessionMigrationCheckpoint, null>) => void;
};

type RetireLegacySessionDependencies = Pick<
  MigrateLegacySessionDependencies,
  "getCheckpoint" | "setCheckpoint"
> & {
  clearLegacy: () => Promise<void>;
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

export const copyLegacySession: (
  deps: CopyLegacySessionDependencies,
) => Promise<CopyLegacySessionResult> = async ({ getStored, setStored, readLegacy }) => {
  if (isPresent(getStored())) {
    return "already-stored";
  }

  const legacy = await readLegacy();

  if (!isPresent(legacy)) {
    return "absent";
  }

  setStored(legacy);

  if (getStored() !== legacy) {
    throw new Error("The migrated session could not be verified in secure storage");
  }

  return "copied";
};

/** Runs once per cold start. Returns whether the stored session's provenance
    is the legacy jar — only then may finalization later clear that jar. */
export const migrateLegacySession: (
  deps: MigrateLegacySessionDependencies,
) => Promise<{ result: MigrateLegacySessionResult; legacyProvenance: boolean }> = async (deps) => {
  const { getStored, setStored, readLegacy, getCheckpoint } = deps;

  if (getCheckpoint() === "complete") {
    return { legacyProvenance: false, result: "complete" };
  }

  const stored = getStored();

  if (getCheckpoint() === "cleanup-pending" && isPresent(stored)) {
    return { legacyProvenance: true, result: "cleanup-pending" };
  }

  if (getCheckpoint() === null && isPresent(stored)) {
    const legacy = await readLegacy();

    if (isPresent(legacy) && legacy === stored) {
      setCheckpointVerified(deps, "cleanup-pending");

      return { legacyProvenance: true, result: "cleanup-pending" };
    }

    setCheckpointVerified(deps, "complete");

    return { legacyProvenance: false, result: "already-stored" };
  }

  const result = await copyLegacySession({ getStored, readLegacy, setStored });

  if (result === "copied") {
    setCheckpointVerified(deps, "cleanup-pending");
  }

  return { legacyProvenance: result === "copied", result };
};

export const finalizeLegacySession: (
  deps: FinalizeLegacySessionDependencies,
) => Promise<"cleared" | "deferred"> = async ({
  authenticated,
  getStored,
  getCheckpoint,
  setCheckpoint,
  clearLegacy,
}) => {
  if (!authenticated || !isPresent(getStored()) || getCheckpoint() !== "cleanup-pending") {
    return "deferred";
  }

  await clearLegacy();

  setCheckpointVerified({ getCheckpoint, setCheckpoint }, "complete");

  return "cleared";
};

/** The user ended their session on this device (sign-out, account deletion).
    Until finalization has run, the next cold start would copy the legacy
    cookie again and silently sign them back in — so reach the terminal
    checkpoint now. Clearing the jar is best-effort: the checkpoint alone is
    what stops the resurrection, and a cookie nothing reads is harmless. */
export const retireLegacySession: (
  deps: RetireLegacySessionDependencies,
) => Promise<"retired" | "already-complete"> = async (deps) => {
  if (deps.getCheckpoint() === "complete") {
    return "already-complete";
  }

  setCheckpointVerified(deps, "complete");

  try {
    await deps.clearLegacy();
  } catch {
    return "retired";
  }

  return "retired";
};

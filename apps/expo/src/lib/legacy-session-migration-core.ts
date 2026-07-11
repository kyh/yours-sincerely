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

const isPresent = (value: string | null): value is string => value !== null && value.length > 0;

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

  setCheckpoint("complete");
  if (getCheckpoint() !== "complete") {
    throw new Error("The migration completion checkpoint could not be verified");
  }

  return "cleared";
};

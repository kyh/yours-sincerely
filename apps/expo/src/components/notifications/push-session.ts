import type { PermissionStatus } from "expo-notifications";

/** Push registration state for one account. The coordinator holding it stays
    mounted across account changes, so a registration still in flight for the
    previous account must not write into the next one's state. */
interface PushSession {
  userId: string | null;
  expoPushToken: string | null;
  permission: PermissionStatus | null;
  registrationFailed: boolean;
  registering: boolean;
}

export const createPushSession = (userId: string | null): PushSession => ({
  expoPushToken: null,
  permission: null,
  registering: false,
  registrationFailed: false,
  userId,
});

/** A `setState` updater that lands only while `userId` still owns the session. */
export const patchPushSession =
  (userId: string, patch: Partial<Omit<PushSession, "userId">>) => (session: PushSession) =>
    session.userId === userId ? { ...session, ...patch } : session;

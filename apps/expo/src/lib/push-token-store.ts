import * as SecureStore from "expo-secure-store";

const PUSH_TOKEN_KEY = "registered-push-token";
const PUSH_TOKEN_USER_KEY = "registered-push-token-user";
const PUSH_CLEANUP_CAPABILITY_KEY = "registered-push-cleanup-capability";

export type RegisteredPushDevice = { cleanupCapability: string; token: string; userId: string };

export const getRegisteredPushDevice = (): RegisteredPushDevice | null => {
  const token = SecureStore.getItem(PUSH_TOKEN_KEY);
  const userId = SecureStore.getItem(PUSH_TOKEN_USER_KEY);
  const cleanupCapability = SecureStore.getItem(PUSH_CLEANUP_CAPABILITY_KEY);
  return token === null || userId === null || cleanupCapability === null
    ? null
    : { cleanupCapability, token, userId };
};

export const setRegisteredPushDevice = ({
  cleanupCapability,
  token,
  userId,
}: RegisteredPushDevice) => {
  SecureStore.setItem(PUSH_TOKEN_USER_KEY, userId);
  SecureStore.setItem(PUSH_CLEANUP_CAPABILITY_KEY, cleanupCapability);
  SecureStore.setItem(PUSH_TOKEN_KEY, token);
};

export const deleteRegisteredPushDevice = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(PUSH_TOKEN_KEY),
    SecureStore.deleteItemAsync(PUSH_TOKEN_USER_KEY),
    SecureStore.deleteItemAsync(PUSH_CLEANUP_CAPABILITY_KEY),
  ]);
};

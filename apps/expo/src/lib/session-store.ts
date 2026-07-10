import * as SecureStore from "expo-secure-store";

/** Holds the raw signed `__session` cookie value issued by the API
    (see packages/api/src/auth/session.ts). SecureStore is the single
    source of truth — the native cookie jar is never consulted. */
const SESSION_KEY = "session-cookie";

export const getSessionCookie = () => SecureStore.getItem(SESSION_KEY);

export const setSessionCookie = (value: string) => {
  SecureStore.setItem(SESSION_KEY, value);
};

export const deleteSessionCookie = async () => {
  await SecureStore.deleteItemAsync(SESSION_KEY);
};

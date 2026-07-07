import Constants from "expo-constants";

const PROD_URL = "https://yourssincerely.org";

/**
 * Dev builds talk to the local web dev server (`pnpm dev:web`) over LAN —
 * the host is derived from the Metro server URI. Production builds hit
 * the live site.
 */
export const getBaseUrl = () => {
  if (!__DEV__) return PROD_URL;
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (!host) return PROD_URL;
  const port = process.env.EXPO_PUBLIC_API_PORT ?? "3000";
  return `http://${host}:${port}`;
};

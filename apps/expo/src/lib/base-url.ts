import Constants from "expo-constants";

const PROD_URL = "https://yourssincerely.org";

/**
 * Dev builds talk to the local web dev server (`pnpm dev:web`) over LAN —
 * the host is derived from the Metro server URI. Production builds hit
 * the live site.
 */
export const getBaseUrl = () => {
  // Explicit escape hatch: point any build (incl. release) at a chosen API,
  // e.g. a local server for screenshots or a staging host. Inlined at build time.
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) return override;
  if (!__DEV__) return PROD_URL;
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (!host) return PROD_URL;
  const port = process.env.EXPO_PUBLIC_API_PORT ?? "3000";
  return `http://${host}:${port}`;
};

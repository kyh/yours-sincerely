import { AppState, Platform } from "react-native";
import { onlineManager } from "@tanstack/react-query";

import { getBaseUrl } from "./base-url";

const ONLINE_POLL_INTERVAL_MS = 60_000;
const OFFLINE_POLL_INTERVAL_MS = 10_000;
const PROBE_TIMEOUT_MS = 5_000;

const probeApiReachability = async (): Promise<boolean> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    // Any HTTP response proves reachability. This works before a dedicated
    // health route is deployed and avoids coupling connectivity to auth.
    await fetch(getBaseUrl(), {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

export const refreshConnectivity = async () => {
  const online = await probeApiReachability();
  onlineManager.setOnline(online);
  return online;
};

export const subscribeToNativeConnectivity = () => {
  if (Platform.OS === "web") return () => undefined;

  let disposed = false;
  let pollTimer: ReturnType<typeof setTimeout> | null = null;

  const scheduleProbe = (online: boolean) => {
    if (disposed) return;
    if (pollTimer !== null) clearTimeout(pollTimer);
    pollTimer = setTimeout(
      () => {
        runProbe().catch(() => undefined);
      },
      online ? ONLINE_POLL_INTERVAL_MS : OFFLINE_POLL_INTERVAL_MS,
    );
  };

  const runProbe = async () => {
    const online = await refreshConnectivity();
    scheduleProbe(online);
  };

  const appStateSubscription = AppState.addEventListener("change", (status) => {
    if (status === "active") runProbe().catch(() => undefined);
    else if (pollTimer !== null) clearTimeout(pollTimer);
  });

  runProbe().catch(() => undefined);

  return () => {
    disposed = true;
    if (pollTimer !== null) clearTimeout(pollTimer);
    appStateSubscription.remove();
  };
};

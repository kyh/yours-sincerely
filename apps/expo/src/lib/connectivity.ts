import { Platform } from "react-native";
import { onlineManager } from "@tanstack/react-query";
import * as Network from "expo-network";

import { getBaseUrl } from "./base-url";
import { ignoreRejection } from "./ignore-rejection";

const PROBE_TIMEOUT_MS = 5000;

/** `isInternetReachable` is undefined while the OS is still deciding; treat
    that as online so a cold start never paints the offline banner first. */
const isOnline = (state: Network.NetworkState) =>
  state.isInternetReachable ?? state.isConnected ?? true;

const probeApiReachability = async (): Promise<boolean> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    // Any HTTP response proves reachability. This works before a dedicated
    // health route is deployed and avoids coupling connectivity to auth.
    await fetch(getBaseUrl(), {
      cache: "no-store",
      method: "HEAD",
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

/** Manual retry: the OS may still report a captive or flaky link as
    connected, so the button asks the API itself. */
export const refreshConnectivity = async () => {
  const online = await probeApiReachability();
  onlineManager.setOnline(online);
  return online;
};

export const subscribeToNativeConnectivity = () => {
  if (Platform.OS === "web") {
    return () => {
      // Web has no native listener to remove.
    };
  }

  const subscription = Network.addNetworkStateListener((state) => {
    onlineManager.setOnline(isOnline(state));
  });

  const applyCurrentState = async () => {
    const state = await Network.getNetworkStateAsync();
    onlineManager.setOnline(isOnline(state));
  };
  void ignoreRejection(applyCurrentState());

  return () => subscription.remove();
};

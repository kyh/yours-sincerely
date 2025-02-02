"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
// import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

declare global {
  var config: { platform: string } | undefined;
}

if (typeof window !== "undefined") {
  window.config = window.config || {
    platform: "web",
  };
}

export type Platform = "web" | "ios" | "android";

export const CapacitorContext = createContext<{
  platform: Platform;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
}>({
  platform: "web",
  isIOS: false,
  isAndroid: false,
  isWeb: true,
});

export const useCapacitor = () => {
  return useContext(CapacitorContext);
};

export const CapacitorProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [platform, setPlatform] = useState<Platform>("web");

  useEffect(() => {
    SplashScreen.hide();

    if (Capacitor.isNativePlatform()) {
      setPlatform(Capacitor.getPlatform() as Platform);
    } else {
      setPlatform(window.config?.platform as Platform);
    }

    // App.addListener("backButton", ({ canGoBack }) => {
    //   if (!canGoBack) {
    //     App.exitApp();
    //   } else {
    //     window.history.back();
    //   }
    // });
  }, []);

  const value = useMemo(
    () => ({
      platform,
      isIOS: platform === "ios",
      isAndroid: platform === "android",
      isWeb: platform === "web",
    }),
    [platform],
  );

  return (
    <CapacitorContext.Provider value={value}>
      {children}
    </CapacitorContext.Provider>
  );
};

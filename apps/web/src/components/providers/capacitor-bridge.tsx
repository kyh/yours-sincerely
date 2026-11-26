"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { noop } from "@tanstack/react-query";

export const CapacitorBridge = () => {
  const router = useRouter();

  useEffect(() => {
    if (Capacitor.isPluginAvailable("SplashScreen")) {
      void SplashScreen.hide();
    }

    if (Capacitor.getPlatform() !== "android" || !Capacitor.isPluginAvailable("App")) {
      return noop;
    }

    let disposed = false;
    let listener: PluginListenerHandle | undefined;

    const listen = async () => {
      const handle = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) {
          router.back();
        } else {
          void App.exitApp();
        }
      });

      if (disposed) {
        await handle.remove();

        return;
      }

      listener = handle;
    };

    void listen();

    return () => {
      disposed = true;
      void listener?.remove();
    };
  }, [router]);

  return null;
};

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

export const CapacitorProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  useEffect(() => {
    void SplashScreen.hide();

    let disposed = false;
    let listener: PluginListenerHandle | undefined;
    void App.addListener("backButton", ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        router.back();
      }
    }).then((handle) => {
      if (disposed) {
        return handle.remove();
      }
      listener = handle;
      return undefined;
    });

    return () => {
      disposed = true;
      void listener?.remove();
    };
  }, [router]);

  return <>{children}</>;
};

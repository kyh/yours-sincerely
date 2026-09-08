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
    const listen = async () => {
      const handle = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) {
          router.back();
        } else {
          App.exitApp();
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

  return children;
};

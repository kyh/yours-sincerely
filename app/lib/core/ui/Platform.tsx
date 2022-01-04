import React, { createContext, useContext, useEffect, useState } from "react";

declare global {
  var config: { platform: string } | undefined;
}

if (typeof window !== "undefined") {
  window.config = window.config || {
    platform: "web",
  };
}

export type Platform = "web" | "ios" | "android";

export const PlatformContext = createContext<{
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

export const usePlatform = () => {
  return useContext(PlatformContext);
};

export const PlatformProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [platform, setPlatform] = useState<Platform>("web");

  useEffect(() => {
    setPlatform(window.config?.platform as Platform);
  }, []);

  return (
    <PlatformContext.Provider
      value={{
        platform,
        isIOS: platform === "ios",
        isAndroid: platform === "android",
        isWeb: platform === "web",
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};

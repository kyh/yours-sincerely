import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Yours Sincerely",
  slug: "yours-sincerely",
  scheme: "yourssincerely",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon-light.png",
  userInterfaceStyle: "automatic",
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    bundleIdentifier: "org.yourssincerely.app",
    supportsTablet: true,
    icon: {
      light: "./assets/icon-light.png",
      dark: "./assets/icon-dark.png",
    },
  },
  android: {
    package: "org.yourssincerely.app",
    adaptiveIcon: {
      foregroundImage: "./assets/icon-light.png",
      backgroundColor: "#FBF8EF",
    },
  },
  extra: {
    knockPublicApiKey: process.env.NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY,
    knockFeedChannelId: process.env.NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID,
  },
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
    reactCanary: true,
    reactCompiler: true,
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-image",
    "expo-font",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#FBF8EF",
        image: "./assets/icon-light.png",
        dark: {
          backgroundColor: "#0E0E0C",
          image: "./assets/icon-dark.png",
        },
      },
    ],
  ],
});

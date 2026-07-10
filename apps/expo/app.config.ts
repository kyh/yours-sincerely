import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Yours Sincerely",
  slug: "yours-sincerely",
  owner: "kaiyuhsu",
  scheme: "yourssincerely",
  // Native rewrite replacing the Capacitor app (live store version 1.0).
  version: "2.0.0",
  orientation: "portrait",
  icon: "./assets/icon-light.png",
  userInterfaceStyle: "automatic",
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    // Must match the live App Store app (Capacitor) so this ships as an update
    // and inherits the app container (WebView cookies → session migration).
    bundleIdentifier: "com.kyh.yourssincerely",
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      // Expo's iPad-multitasking default re-enables all orientations on iPad;
      // the app is designed portrait-only, so opt out explicitly.
      UIRequiresFullScreen: true,
      "UISupportedInterfaceOrientations~ipad": ["UIInterfaceOrientationPortrait"],
    },
    icon: {
      light: "./assets/icon-light.png",
      dark: "./assets/icon-dark.png",
    },
  },
  android: {
    package: "com.kyh.yourssincerely",
    adaptiveIcon: {
      foregroundImage: "./assets/icon-light.png",
      backgroundColor: "#FBF8EF",
    },
  },
  extra: {
    eas: {
      projectId: "289e7cea-2c1b-487c-8ab4-ec91572dfb86",
    },
    knockPublicApiKey: process.env.NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY,
    knockFeedChannelId: process.env.NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID,
  },
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
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

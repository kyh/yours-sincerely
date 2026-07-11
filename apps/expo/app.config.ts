import type { ConfigContext, ExpoConfig } from "expo/config";
import {
  MOBILE_ANDROID_PACKAGE,
  MOBILE_APPLE_TEAM_ID,
  MOBILE_IOS_BUNDLE_ID,
} from "@repo/contracts/mobile-identity";

export default ({ config }: ConfigContext): ExpoConfig => {
  const isStoreBuild = process.env.EAS_BUILD_PROFILE === "production";
  const notificationsMode = isStoreBuild ? "production" : "development";
  const appName = isStoreBuild ? "Yours Sincerely" : "Yours Sincerely Preview";
  const scheme = isStoreBuild ? "yourssincerely" : "yourssincerely-preview";
  const iosBundleIdentifier = isStoreBuild
    ? MOBILE_IOS_BUNDLE_ID
    : `${MOBILE_IOS_BUNDLE_ID}.preview`;
  const androidPackage = isStoreBuild
    ? MOBILE_ANDROID_PACKAGE
    : `${MOBILE_ANDROID_PACKAGE}.preview`;

  return {
    ...config,
    name: appName,
    slug: "yours-sincerely",
    owner: "kaiyuhsu",
    scheme,
    // Native rewrite replacing the live Capacitor apps.
    version: "2.0.0",
    orientation: "portrait",
    icon: "./assets/icon-light.png",
    userInterfaceStyle: "automatic",
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      // Production must match the live Capacitor app so the update inherits
      // its app container (WebView cookies → session migration).
      bundleIdentifier: iosBundleIdentifier,
      appleTeamId: MOBILE_APPLE_TEAM_ID,
      associatedDomains: ["applinks:yourssincerely.org"],
      supportsTablet: true,
      requireFullScreen: true,
      entitlements: {
        "aps-environment": notificationsMode,
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        UISupportedInterfaceOrientations: ["UIInterfaceOrientationPortrait"],
        "UISupportedInterfaceOrientations~ipad": ["UIInterfaceOrientationPortrait"],
      },
      icon: {
        light: "./assets/icon-light.png",
        dark: "./assets/icon-dark.png",
      },
    },
    android: {
      package: androidPackage,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          category: ["BROWSABLE", "DEFAULT"],
          data: [
            { scheme: "https", host: "yourssincerely.org", pathPrefix: "/posts/" },
            { scheme: "https", host: "yourssincerely.org", pathPrefix: "/profile/" },
            {
              scheme: "https",
              host: "yourssincerely.org",
              pathPrefix: "/auth/password-update",
            },
          ],
        },
      ],
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
      knockExpoChannelId: process.env.NEXT_PUBLIC_KNOCK_EXPO_CHANNEL_ID,
    },
    experiments: {
      tsconfigPaths: true,
      typedRoutes: true,
      reactCompiler: true,
    },
    plugins: [
      "expo-router",
      ["expo-notifications", { mode: notificationsMode }],
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
  };
};

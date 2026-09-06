import type { ConfigContext, ExpoConfig } from "expo/config";
import {
  MOBILE_ANDROID_PACKAGE,
  MOBILE_APPLE_TEAM_ID,
  MOBILE_DEEP_LINK_PATH_PREFIXES,
  MOBILE_IOS_BUNDLE_ID,
  WEB_HOST,
} from "@repo/contracts/mobile-identity";

export default ({ config }: ConfigContext): ExpoConfig => {
  // Set per build profile in eas.json. eas-cli applies a profile's `env` when
  // it evaluates this file locally, which is where it picks credentials and
  // remote versions by app id; `EAS_BUILD_PROFILE` only exists on the build
  // server, so keying on it would hand a production build the preview identity.
  const isStoreBuild = process.env.APP_VARIANT === "production";
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
    ios: {
      // Production must match the live Capacitor app so the update inherits
      // its app container (WebView cookies → session migration).
      bundleIdentifier: iosBundleIdentifier,
      appleTeamId: MOBILE_APPLE_TEAM_ID,
      associatedDomains: [`applinks:${WEB_HOST}`],
      supportsTablet: true,
      requireFullScreen: true,
      entitlements: {
        "aps-environment": notificationsMode,
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        // `orientation` alone leaves iPad rotatable; requireFullScreen plus this
        // key is what keeps it portrait there too.
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
          data: MOBILE_DEEP_LINK_PATH_PREFIXES.map((pathPrefix) => ({
            scheme: "https",
            host: WEB_HOST,
            pathPrefix,
          })),
        },
      ],
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        monochromeImage: "./assets/adaptive-icon.png",
        backgroundColor: "#000000",
      },
      blockedPermissions: [
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.SYSTEM_ALERT_WINDOW",
      ],
    },
    extra: {
      eas: {
        projectId: "289e7cea-2c1b-487c-8ab4-ec91572dfb86",
      },
    },
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    plugins: [
      "expo-router",
      [
        "expo-notifications",
        {
          mode: notificationsMode,
          icon: "./assets/notification-icon.png",
          color: "#000000",
        },
      ],
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

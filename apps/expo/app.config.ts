import type { ConfigContext, ExpoConfig } from "expo/config";
import {
  MOBILE_ANDROID_PACKAGE,
  MOBILE_APPLE_TEAM_ID,
  MOBILE_DEEP_LINK_PATH_PREFIXES,
  MOBILE_IOS_BUNDLE_ID,
  WEB_HOST,
} from "@repo/contracts/mobile-identity";

const defineConfig = ({ config }: ConfigContext): ExpoConfig => {
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
    android: {
      adaptiveIcon: {
        backgroundColor: "#000000",
        foregroundImage: "./assets/adaptive-icon.png",
        monochromeImage: "./assets/adaptive-icon.png",
      },
      blockedPermissions: [
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.SYSTEM_ALERT_WINDOW",
      ],
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          category: ["BROWSABLE", "DEFAULT"],
          data: MOBILE_DEEP_LINK_PATH_PREFIXES.map((pathPrefix) => ({
            host: WEB_HOST,
            pathPrefix,
            scheme: "https",
          })),
        },
      ],
      package: androidPackage,
    },
    experiments: {
      reactCompiler: true,
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: "289e7cea-2c1b-487c-8ab4-ec91572dfb86",
      },
    },
    icon: "./assets/icon-light.png",
    ios: {
      appleTeamId: MOBILE_APPLE_TEAM_ID,
      associatedDomains: [`applinks:${WEB_HOST}`],
      // Production must match the live Capacitor app so the update inherits
      // its app container (WebView cookies → session migration).
      bundleIdentifier: iosBundleIdentifier,
      entitlements: {
        "aps-environment": notificationsMode,
      },
      icon: {
        dark: "./assets/icon-dark.png",
        light: "./assets/icon-light.png",
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        // `orientation` alone leaves iPad rotatable; requireFullScreen plus this
        // key is what keeps it portrait there too.
        "UISupportedInterfaceOrientations~ipad": ["UIInterfaceOrientationPortrait"],
      },
      requireFullScreen: true,
      supportsTablet: true,
    },
    name: appName,
    orientation: "portrait",
    owner: "kaiyuhsu",
    plugins: [
      "expo-router",
      [
        "expo-notifications",
        {
          color: "#000000",
          icon: "./assets/notification-icon.png",
          mode: notificationsMode,
        },
      ],
      "expo-secure-store",
      "expo-image",
      "expo-font",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#FBF8EF",
          dark: {
            backgroundColor: "#0E0E0C",
            image: "./assets/icon-dark.png",
          },
          image: "./assets/icon-light.png",
        },
      ],
    ],
    scheme,
    slug: "yours-sincerely",
    userInterfaceStyle: "automatic",
    // Native rewrite replacing the live Capacitor apps.
    version: "2.0.0",
  };
};

export default defineConfig;

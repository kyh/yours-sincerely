import type { ConfigContext, ExpoConfig } from "expo/config";
import {
  MOBILE_ANDROID_PACKAGE,
  MOBILE_APPLE_TEAM_ID,
  MOBILE_DEEP_LINK_PATH_PREFIXES,
  MOBILE_IOS_BUNDLE_ID,
  WEB_HOST,
} from "@repo/contract/site/mobile-identity";

const defineConfig: (context: ConfigContext) => ExpoConfig = ({ config }) => {
  // WARNING: key on APP_VARIANT from eas.json, never EAS_BUILD_PROFILE, which exists only on the build server and would give production the preview identity.
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
      // WARNING: production must keep the live Capacitor app's identity so the update inherits its WebView cookies.
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
    version: "2.0.0",
  };
};

export default defineConfig;

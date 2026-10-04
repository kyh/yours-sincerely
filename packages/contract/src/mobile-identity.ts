/** Public, immutable identity of the existing App Store and Play Store apps. */
export const MOBILE_IOS_BUNDLE_ID = "com.tehkaiyu.yourssincerely";
export const MOBILE_ANDROID_PACKAGE = "com.kyh.yourssincerely";
export const MOBILE_APPLE_TEAM_ID = "N89P364V32";
export const MOBILE_ANDROID_CERT_SHA256_FINGERPRINTS = Object.freeze([
  // Play app-signing certificate; verified in Play Console on 2026-09-19.
  "95:6E:8F:3D:D8:7D:49:0B:98:D6:C1:52:D9:FD:A8:E9:27:1E:5B:BB:3A:E1:83:F6:41:32:EB:F1:2E:89:4A:BB",
  // Archived PWABuilder signing certificate; retained for existing installations.
  "A5:4E:25:FA:9A:72:34:61:1E:74:10:40:96:71:7F:6D:9B:0B:67:FE:D8:45:8D:93:23:EB:8B:4F:94:61:9C:24",
]);

export const WEB_HOST = "yourssincerely.org";

/** Route prefixes the mobile app handles as universal/app links. iOS AASA
    patterns and Android intent filters both derive from this list — it must
    match real routes in both apps or deep links break silently. */
export const MOBILE_DEEP_LINK_PATH_PREFIXES = Object.freeze([
  "/posts/",
  "/profile/",
  "/auth/password-update",
]);

/** Public, immutable identity of the existing App Store and Play Store apps. */
export const MOBILE_IOS_BUNDLE_ID = "com.tehkaiyu.yourssincerely";
export const MOBILE_ANDROID_PACKAGE = "com.kyh.yourssincerely";
export const MOBILE_APPLE_TEAM_ID = "N89P364V32";
export const MOBILE_ANDROID_CERT_SHA256_FINGERPRINTS = Object.freeze([
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

import { readFileSync } from "node:fs";

const webRequired = [
  "COOKIE_SECRET",
  "NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY",
  "NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID",
  "KNOCK_API_KEY",
  "KNOCK_SIGNING_KEY",
  "RESEND_API_KEY",
];

const easRequired = [
  "NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY",
  "NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID",
  "NEXT_PUBLIC_KNOCK_EXPO_CHANNEL_ID",
  "EXPO_PUBLIC_SENTRY_DSN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
  "SENTRY_AUTH_TOKEN",
  "GOOGLE_SERVICES_JSON",
];

const targetFlagIndex = process.argv.indexOf("--target");
const target = targetFlagIndex === -1 ? "all" : process.argv[targetFlagIndex + 1];
const validTargets = new Set(["all", "eas", "web"]);

if (!target || !validTargets.has(target)) {
  console.error("Usage: validate-mobile-release-env.mjs [--target all|eas|web] [--if-production]");
  process.exit(2);
}

if (process.argv.includes("--if-production") && process.env.EAS_BUILD_PROFILE !== "production") {
  console.log("Skipping production release validation for a non-production EAS build.");
  process.exit(0);
}

const required = [
  ...new Set([...(target === "eas" ? [] : webRequired), ...(target === "web" ? [] : easRequired)]),
];

const missing = required.filter((name) => !process.env[name]?.trim());
const invalid = [];
const knockPublicKey = process.env.NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY;
const knockSecretKey = process.env.KNOCK_API_KEY;

if (knockPublicKey?.includes("_test_")) {
  invalid.push("NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY", "NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID");
}

if (target !== "eas" && knockSecretKey?.includes("_test_")) {
  invalid.push("KNOCK_API_KEY");
}

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (sentryDsn !== undefined && sentryDsn !== "") {
  try {
    const parsed = new URL(sentryDsn);
    if (parsed.protocol !== "https:") invalid.push("EXPO_PUBLIC_SENTRY_DSN");
  } catch {
    invalid.push("EXPO_PUBLIC_SENTRY_DSN");
  }
}

const googleServicesFile = process.env.GOOGLE_SERVICES_JSON;
if (target !== "web" && googleServicesFile) {
  try {
    const googleServices = JSON.parse(readFileSync(googleServicesFile, "utf8"));
    const clients = Array.isArray(googleServices.client) ? googleServices.client : [];
    const hasProductionAndroidApp = clients.some(
      (client) =>
        client?.client_info?.android_client_info?.package_name === "com.kyh.yourssincerely",
    );

    if (!hasProductionAndroidApp) invalid.push("GOOGLE_SERVICES_JSON");
  } catch {
    invalid.push("GOOGLE_SERVICES_JSON");
  }
}

if (missing.length > 0 || invalid.length > 0) {
  if (missing.length > 0) console.error(`Missing: ${missing.join(", ")}`);
  if (invalid.length > 0) console.error(`Invalid: ${[...new Set(invalid)].join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`Mobile ${target} release configuration is complete.`);
}

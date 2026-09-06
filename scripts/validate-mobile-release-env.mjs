import { readFileSync } from "node:fs";

// Node 22.18+ strips types, so the canonical identity constants import directly.
import { MOBILE_ANDROID_PACKAGE } from "../packages/contracts/src/mobile-identity.ts";

const webRequired = ["COOKIE_SECRET", "RESEND_API_KEY"];

const easRequired = ["GOOGLE_SERVICES_JSON"];

// Inlined into the bundle by apps/expo/src/lib/base-url.ts, where they repoint
// a store build at another API. Development-only escape hatches.
const easForbidden = ["EXPO_PUBLIC_API_URL", "EXPO_PUBLIC_API_PORT"];

const targetFlagIndex = process.argv.indexOf("--target");
const target = targetFlagIndex === -1 ? "all" : process.argv[targetFlagIndex + 1];
const validTargets = new Set(["all", "eas", "web"]);

if (!target || !validTargets.has(target)) {
  console.error("Usage: validate-mobile-release-env.mjs [--target all|eas|web] [--if-production]");
  process.exit(2);
}

if (process.argv.includes("--if-production") && process.env.APP_VARIANT !== "production") {
  console.log("Skipping production release validation for a non-production EAS build.");
  process.exit(0);
}

const required = [
  ...new Set([...(target === "eas" ? [] : webRequired), ...(target === "web" ? [] : easRequired)]),
];

const missing = required.filter((name) => !process.env[name]?.trim());
const forbidden = target === "web" ? [] : easForbidden.filter((name) => process.env[name]?.trim());
const invalid = [];

const googleServicesFile = process.env.GOOGLE_SERVICES_JSON;
if (target !== "web" && googleServicesFile) {
  try {
    const googleServices = JSON.parse(readFileSync(googleServicesFile, "utf8"));
    const clients = Array.isArray(googleServices.client) ? googleServices.client : [];
    const hasProductionAndroidApp = clients.some(
      (client) => client?.client_info?.android_client_info?.package_name === MOBILE_ANDROID_PACKAGE,
    );

    if (!hasProductionAndroidApp) invalid.push("GOOGLE_SERVICES_JSON");
  } catch {
    invalid.push("GOOGLE_SERVICES_JSON");
  }
}

if (missing.length > 0 || invalid.length > 0 || forbidden.length > 0) {
  if (missing.length > 0) console.error(`Missing: ${missing.join(", ")}`);
  if (invalid.length > 0) console.error(`Invalid: ${[...new Set(invalid)].join(", ")}`);
  if (forbidden.length > 0) {
    console.error(`Must be unset for a store build: ${forbidden.join(", ")}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Mobile ${target} release configuration is complete.`);
}

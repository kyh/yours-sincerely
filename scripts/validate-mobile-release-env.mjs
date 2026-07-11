const required = [
  "COOKIE_SECRET",
  "APPLE_TEAM_ID",
  "ANDROID_APP_CERT_SHA256_FINGERPRINTS",
  "NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY",
  "NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID",
  "NEXT_PUBLIC_KNOCK_EXPO_CHANNEL_ID",
  "KNOCK_API_KEY",
  "KNOCK_SIGNING_KEY",
  "RESEND_API_KEY",
  "EXPO_PUBLIC_SENTRY_DSN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
  "SENTRY_AUTH_TOKEN",
];

const missing = required.filter((name) => !process.env[name]?.trim());
const invalid = [];
const fingerprints = process.env.ANDROID_APP_CERT_SHA256_FINGERPRINTS?.split(",").map((value) =>
  value.trim(),
);
const fingerprintPattern = /^(?:[A-Fa-f0-9]{2}:){31}[A-Fa-f0-9]{2}$/;

if (fingerprints !== undefined && fingerprints.some((value) => !fingerprintPattern.test(value))) {
  invalid.push("ANDROID_APP_CERT_SHA256_FINGERPRINTS");
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

if (missing.length > 0 || invalid.length > 0) {
  if (missing.length > 0) console.error(`Missing: ${missing.join(", ")}`);
  if (invalid.length > 0) console.error(`Invalid: ${[...new Set(invalid)].join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("Mobile release configuration is complete.");
}

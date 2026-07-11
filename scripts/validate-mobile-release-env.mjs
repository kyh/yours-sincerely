const required = [
  "COOKIE_SECRET",
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
const knockPublicKey = process.env.NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY;
const knockSecretKey = process.env.KNOCK_API_KEY;

if (knockPublicKey?.includes("_test_") || knockSecretKey?.includes("_test_")) {
  invalid.push(
    "NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY",
    "NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID",
    "KNOCK_API_KEY",
  );
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

import { readFileSync } from "node:fs";

import { z } from "zod";

import { MOBILE_ANDROID_PACKAGE } from "../packages/contract/src/site/mobile-identity.ts";

const webRequired = ["COOKIE_SECRET", "RESEND_API_KEY"];

const easRequired = ["GOOGLE_SERVICES_JSON"];

const easForbidden = ["EXPO_PUBLIC_API_URL", "EXPO_PUBLIC_API_PORT"];

const targetFlagIndex = process.argv.indexOf("--target");
const target = targetFlagIndex === -1 ? "all" : process.argv[targetFlagIndex + 1];
const parsedTarget = z.enum(["all", "eas", "web"]).safeParse(target);

if (!parsedTarget.success) {
  console.error("Usage: validate-mobile-release-env.ts [--target all|eas|web] [--if-production]");
  process.exit(2);
}

const releaseTarget = parsedTarget.data;

const isSet = (name: string) => (process.env[name]?.trim() ?? "") !== "";

const googleServicesSchema = z.object({ client: z.array(z.unknown()).catch([]) });

const androidPackageSchema = z.object({
  client_info: z.object({
    android_client_info: z.object({ package_name: z.string() }),
  }),
});

if (process.argv.includes("--if-production") && process.env.APP_VARIANT !== "production") {
  console.log("Skipping production release validation for a non-production EAS build.");
  process.exit(0);
}

const required = [
  ...new Set([
    ...(releaseTarget === "eas" ? [] : webRequired),
    ...(releaseTarget === "web" ? [] : easRequired),
  ]),
];

const missing = required.filter((name) => !isSet(name));
const forbidden = releaseTarget === "web" ? [] : easForbidden.filter((name) => isSet(name));
const invalid: string[] = [];

const googleServicesFile = process.env.GOOGLE_SERVICES_JSON;

if (releaseTarget !== "web" && googleServicesFile !== undefined && googleServicesFile !== "") {
  try {
    const { client: clients } = googleServicesSchema.parse(
      JSON.parse(readFileSync(googleServicesFile, "utf-8")),
    );

    const hasProductionAndroidApp = clients.some(
      (client) =>
        androidPackageSchema.safeParse(client).data?.client_info.android_client_info
          .package_name === MOBILE_ANDROID_PACKAGE,
    );

    if (!hasProductionAndroidApp) {
      invalid.push("GOOGLE_SERVICES_JSON");
    }
  } catch {
    invalid.push("GOOGLE_SERVICES_JSON");
  }
}

if (missing.length > 0 || invalid.length > 0 || forbidden.length > 0) {
  if (missing.length > 0) {
    console.error(`Missing: ${missing.join(", ")}`);
  }

  if (invalid.length > 0) {
    console.error(`Invalid: ${[...new Set(invalid)].join(", ")}`);
  }

  if (forbidden.length > 0) {
    console.error(`Must be unset for a store build: ${forbidden.join(", ")}`);
  }

  process.exitCode = 1;
} else {
  console.log(`Mobile ${releaseTarget} release configuration is complete.`);
}

import {
  MOBILE_ANDROID_CERT_SHA256_FINGERPRINTS,
  MOBILE_ANDROID_PACKAGE,
} from "@repo/contracts/mobile-identity";

export const dynamic = "force-dynamic";

export const GET = () => {
  const statements = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: MOBILE_ANDROID_PACKAGE,
        sha256_cert_fingerprints: MOBILE_ANDROID_CERT_SHA256_FINGERPRINTS,
      },
    },
  ];

  return Response.json(statements, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
};

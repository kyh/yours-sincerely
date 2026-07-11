const ANDROID_PACKAGE = "com.kyh.yourssincerely";
const SHA256_FINGERPRINT = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/;

export const dynamic = "force-dynamic";

const getFingerprints = () =>
  (process.env.ANDROID_APP_CERT_SHA256_FINGERPRINTS ?? "")
    .split(",")
    .map((fingerprint) => fingerprint.trim().toUpperCase())
    .filter((fingerprint) => SHA256_FINGERPRINT.test(fingerprint));

export const GET = () => {
  const fingerprints = getFingerprints();
  const statements =
    fingerprints.length === 0
      ? []
      : [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: ANDROID_PACKAGE,
              sha256_cert_fingerprints: fingerprints,
            },
          },
        ];

  return Response.json(statements, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
};

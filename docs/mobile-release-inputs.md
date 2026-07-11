# Mobile release inputs

Code-side release work is complete. Fill these values in the production EAS environment and the web deployment environment.

## Session continuity

- `COOKIE_SECRET`: current production web session signer.
- `COOKIE_SECRET_LEGACY`: only needed after rotation. Keep the signer used by the live Capacitor build in this comma-separated verification-only list.

These are web/server secrets, not EAS values. Losing the legacy signer invalidates old Capacitor sessions before Expo can migrate them.

## App links

- `APPLE_TEAM_ID`: Apple Developer account team ID.
- `ANDROID_APP_CERT_SHA256_FINGERPRINTS`: Play Console > App integrity > App signing key certificate. Use the SHA-256 fingerprint. Separate multiple fingerprints with commas.

Both values must also exist on the web deployment so `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` can render valid associations.

## Notifications

- `NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY`: Knock public API key.
- `NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID`: Knock in-app feed channel ID.
- `NEXT_PUBLIC_KNOCK_EXPO_CHANNEL_ID`: Knock Expo push channel ID.
- `KNOCK_API_KEY`: Knock server API key. Web/server only.
- `KNOCK_SIGNING_KEY`: base64 application signing key from Knock. Keep server-only. After deploying it, enable Enhanced Security in the Knock production environment.
- `RESEND_API_KEY`: Resend server API key for transactional email. Web/server only.

Configure APNs and FCM credentials on the Knock Expo channel. Then use a physical iPhone and Android device to opt in, receive a notification, and open its exact post.

## Crash reporting

Create one React Native project in Sentry.

- `EXPO_PUBLIC_SENTRY_DSN`: project DSN. Safe to embed in the app.
- `SENTRY_ORG`: organization slug.
- `SENTRY_PROJECT`: project slug.
- `SENTRY_AUTH_TOKEN`: source-map upload token. EAS secret only; never expose as `EXPO_PUBLIC_*`.

## Validate

Put local test values in `.env`, then run:

```sh
pnpm release:mobile:check
```

## Preserve store identity

Before the first production build:

- iOS: use the existing App Store Connect app and bundle ID `com.kyh.yourssincerely`. Seed EAS remote build version above the live Capacitor build number.
- Android: import/reuse the existing Play upload keystore for `com.kyh.yourssincerely`; do not generate a replacement. Confirm its certificate matches Play Console > App integrity. Seed EAS remote version code above the live build.
- Check/import credentials with `pnpm exec eas credentials`. Set remote versions with `pnpm exec eas build:version:set`.

`apps/expo/eas.json` uses remote versions and auto-increments production builds after the initial seed.

After values pass, create production builds from `apps/expo`:

```sh
pnpm exec eas build --profile production --platform all
```

Final manual-only checks:

1. Capacitor store build logged-in upgrade to Expo on physical iPhone.
2. Android Capacitor logged-in upgrade to Expo on physical Android device.
3. Cold, warm, and background universal links for post, profile, and password reset.
4. Physical push delivery and exact-post navigation on iOS and Android.
5. One intentional test error appears symbolicated in Sentry, then remove the trigger before submission.

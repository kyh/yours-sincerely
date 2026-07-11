# Mobile release inputs

Code-side release work is complete. Fill these values in the production EAS environment and the web deployment environment.

For install commands and the exact upgrade test, use [phone testing](./phone-testing.md).

## Session continuity

- `COOKIE_SECRET`: current production web session signer.
- `COOKIE_SECRET_LEGACY`: only needed after rotation. Keep the signer used by the live Capacitor build in this comma-separated verification-only list.

These are web/server secrets, not EAS values. Losing the legacy signer invalidates old Capacitor sessions before Expo can migrate them.

## App links

The existing store identity is committed in `packages/contracts/src/mobile-identity.ts`. It intentionally preserves different shipped IDs: iOS `com.tehkaiyu.yourssincerely`, Android `com.kyh.yourssincerely`. It drives Expo signing and both web association files, so deployments cannot drift from the live store apps.

## Notifications

- `NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY`: Knock public API key.
- `NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID`: Knock in-app feed channel ID.
- `NEXT_PUBLIC_KNOCK_EXPO_CHANNEL_ID`: Knock Expo push channel ID.
- `KNOCK_API_KEY`: Knock server API key. Web/server only.
- `KNOCK_SIGNING_KEY`: optional base64 application signing key from Knock. Add it server-side only if enabling Knock Enhanced Security.
- `RESEND_API_KEY`: Resend server API key for transactional email. Web/server only.
- `GOOGLE_SERVICES_JSON`: EAS file variable containing the Firebase Android app config for `com.kyh.yourssincerely`.

The existing public key and feed channel were copied from Vercel production into EAS preview and production. All Knock keys and channel IDs must come from that same Knock environment. The release check rejects explicitly marked `_test_` API keys.

Configure APNs and FCM V1 credentials in EAS. Configure the Knock Expo channel with Expo project `@kaiyuhsu/yours-sincerely` and, only when Expo Enhanced Push Security is enabled, an Expo access token. Then use physical devices to opt in, receive a notification, and open its exact post.

## Validate

Put local test values in `.env`, then run:

```sh
pnpm release:mobile:check
```

## Preserve store identity

Before the first production build:

- iOS: use the existing App Store Connect app and bundle ID `com.tehkaiyu.yourssincerely`. Seed EAS remote build version above the live Capacitor build number.
- Android: import/reuse the existing Play upload keystore for `com.kyh.yourssincerely`; do not generate a replacement. Confirm its certificate matches Play Console > App integrity. Seed EAS remote version code above the live build.
- Check/import credentials with `pnpm exec eas credentials`. Set remote versions with `pnpm exec eas build:version:set`.

`apps/expo/eas.json` uses remote versions and auto-increments production builds after the initial seed.

After values pass, create production builds from `apps/expo`. Production EAS builds also run the EAS-only release check remotely and fail before compilation if mobile keys are missing:

```sh
pnpm exec eas build --profile production --platform all
```

Final manual-only checks:

1. Capacitor store build logged-in upgrade to Expo on physical iPhone.
2. Android Capacitor logged-in upgrade to Expo on physical Android device.
3. Cold, warm, and background universal links for post, profile, and password reset.
4. Physical push delivery and exact-post navigation on iOS and Android.

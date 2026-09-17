# Mobile release inputs

Release prerequisites and remaining device checks. The current Expo candidate is still
under parity review; configured credentials alone do not establish release readiness.

Release audit, 2026-09-12:

- Production Vercel lists `COOKIE_SECRET`, `COOKIE_SECRET_LEGACY`, and `RESEND_API_KEY`.
  Secret values were not read. Presence does not prove that the legacy signer is correct.
- Production EAS lists `GOOGLE_SERVICES_JSON`; neither API override is listed.
- EAS has a finished production iOS build `964a431b-4302-414e-9004-fbca69923eeb`
  from 2026-09-05, version `2.0.0`, build `2026090503`. It predates the current changes.
- The user authorized source upload and builds, with no store submission. Current-source
  iOS build `b4684f7f-ed6f-42a4-8878-a476650daf9d` (`2026090504`) finished using the
  existing distribution certificate and provisioning profile, both last updated September 5.
  The downloaded IPA passed `codesign --verify --deep --strict`; its profile matches the
  existing certificate serial, team `N89P364V32`, production push, and
  `com.tehkaiyu.yourssincerely`, with debugging disabled. It supports iPhone and iPad.
- EAS CLI 23.2.0 generated an Android keystore despite `--freeze-credentials`; the flag
  does not guard Android generation. Build `4b1db3e3-9bf4-4fdb-a0d7-2c3383c80751`
  (`2026090501`) was canceled with no artifact. Its newly generated key was removed and
  the preview credential was verified unchanged. Production's build configuration is empty.
- The original Android key was found in an older local release archive at
  `~/Documents/Desktop/code/yours-sincerely/signing.keystore`, alias `my-key-alias`.
  Its SHA-256 fingerprint is
  `A5:4E:25:FA:9A:72:34:61:1E:74:10:40:96:71:7F:6D:9B:0B:67:FE:D8:45:8D:93:23:EB:8B:4F:94:61:9C:24`.
  It matches the archived APK and AAB certificates and the committed Android fingerprint;
  the APK identifies `com.kyh.yourssincerely`, version `1.1.0.0` (`40`). The password is
  still needed to verify keystore integrity and unlock the private key. Current Play Console
  upload-key acceptance remains unverified.
- Production Android explicitly uses local credentials, so missing credentials fail before
  upload instead of generating a key. Supply the verified original key in ignored,
  mode-0600 `apps/expo/credentials.json`; iOS continues using existing remote credentials.
- Production FCM V1 and Play submission service-account credentials are not assigned in EAS.

For install commands and the exact upgrade test, use [phone testing](./phone-testing.md).

## Session continuity

- `COOKIE_SECRET`: current production web session signer.
- `COOKIE_SECRET_LEGACY`: only needed after rotation. Keep the signer used by the live Capacitor build in this comma-separated verification-only list.

These are web/server secrets, not EAS values. Losing the legacy signer invalidates old Capacitor sessions before Expo can migrate them.

### Android runtime provenance

The archived `Yours Sincerely.apk` and `.aab` beside the recovered key are PWABuilder
Trusted Web Activity builds (`1.1.0.0`, APK code `40`), with a trusted-browser launcher,
`generatorApp=PWABuilder`, `fallbackType=customtabs`, and `https://yourssincerely.org/`.
They establish the signing certificate, not the current Play runtime.

Git introduced Capacitor on 2023-02-04 (`5b8f6a57`) and raised its Android version to
`1.1.1`/`111` on 2023-02-07 (`ba74553b`). The
[public Play listing](https://play.google.com/store/apps/details?id=com.kyh.yourssincerely)
shows an update date of 2023-02-06. These dates do not prove which artifact shipped.
The read-only Play Console check reached Google's signed-out account chooser; no release
artifacts were accessible through that session.

Inspect the current Play-delivered APK or Play Console production artifact, and whether
older TWA builds ever shipped. TWA sessions live in the browser;
[Chrome documents that the host app cannot read those cookies](https://developer.chrome.com/docs/android/trusted-web-activity).
Our Android bridge reads only `android.webkit.CookieManager`, so a TWA-only installation
would not be imported. If that cohort exists, direct upgrades need a browser-assisted
session transfer before release. Passing the Capacitor fixture does not cover this case.

## App links

The existing store identity is committed in `packages/contracts/src/mobile-identity.ts`. It intentionally preserves different shipped IDs: iOS `com.tehkaiyu.yourssincerely`, Android `com.kyh.yourssincerely`. It drives Expo signing and both web association files, so deployments cannot drift from the live store apps.

## Notifications

Notifications are rows in the `Notification` table, written by the API when someone
replies to a letter, and pushed to phones through Expo's push service. No server-side
key: the server posts to `exp.host` unauthenticated and the device credentials live in
EAS.

- `RESEND_API_KEY`: Resend server API key for transactional email. Web/server only.
- `GOOGLE_SERVICES_JSON`: EAS file variable containing the Firebase Android app config for `com.kyh.yourssincerely`.
- iOS: APNs key, created and stored by EAS during `eas credentials` for production.
- Android: FCM V1 service-account key, uploaded to EAS as the production push credential, plus the file above.

Then use physical devices to opt in, receive a notification, and open its exact post.

## Validate

Put local test values in `.env`, then run:

```sh
pnpm release:mobile:check
```

The check also refuses `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_API_PORT`: they are inlined
into the bundle and would repoint a store build at another API. Keep them out of the
production EAS environment.

`GOOGLE_SERVICES_JSON` is listed in production EAS. The current iOS cloud build passed
the production validator, including its Android package check and forbidden API overrides.
This does not establish FCM V1 push credentials or delivery. Local `.env` is for development.

## Preserve store identity

Before the first production build:

- iOS: use the existing App Store Connect app and bundle ID `com.tehkaiyu.yourssincerely`. Seed EAS remote build version above the live Capacitor build number.
- Android: import/reuse the existing Play upload keystore for `com.kyh.yourssincerely`; do not generate a replacement. Confirm its certificate matches Play Console > App integrity. Seed EAS remote version code above the live build.
- Check/import credentials with `pnpm exec eas credentials`. Set remote versions with `pnpm exec eas build:version:set`.

`apps/expo/eas.json` uses remote versions and auto-increments production builds after the initial seed.

Screenshots: the live iOS app supports iPad, and an update cannot drop that, so App Store
Connect needs 13" iPad screenshots (2064×2752) alongside the 6.9" iPhone frames in
`apps/expo/store-screenshots/`. `store-screenshots/ipad/` holds five raw iPad Pro 13" (M4)
captures (feed, letter, profile, dark feed, dark letter) taken from the simulator against
the seeded local API; upload them as-is or re-frame them to match the iPhone set.

After values pass, create production builds from `apps/expo`. Production EAS builds also run the EAS-only release check remotely and fail before compilation if mobile keys are missing:

```sh
pnpm exec eas build --profile production --platform all
```

Final manual-only checks:

1. Capacitor store build logged-in upgrade to Expo on physical iPhone.
2. Android Capacitor logged-in upgrade to Expo on physical Android device.
3. Cold, warm, and background universal links for post, profile, and password reset.
4. Physical push delivery and exact-post navigation on iOS and Android.

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
- An archived Android key was found at
  `~/Documents/Desktop/code/yours-sincerely/signing.keystore`, alias `my-key-alias`.
  Its SHA-256 fingerprint is
  `A5:4E:25:FA:9A:72:34:61:1E:74:10:40:96:71:7F:6D:9B:0B:67:FE:D8:45:8D:93:23:EB:8B:4F:94:61:9C:24`.
  It matches the archived APK/AAB, package `com.kyh.yourssincerely`, version `1.1.0.0`
  (code `40`). Play Console verification on September 19 established that it matches
  neither the current upload certificate nor the Play app-signing certificate. Recovering
  its password alone would not unblock production uploads.
- Production Android explicitly uses local credentials, so missing credentials fail before
  upload instead of generating a key. Supply a key matching Play's current upload certificate in ignored,
  mode-0600 `apps/expo/credentials.json`; iOS continues using existing remote credentials.
- Production FCM V1 is assigned in EAS as of September 19; see Notifications below.
  The production Android keystore remains absent while Play processes the upload-key reset.
  Play submission credentials remain unassigned; no store submission is authorized.

Play Console signing, verified 2026-09-19:

- Play manages app signing. Its SHA-256 certificate is
  `95:6E:8F:3D:D8:7D:49:0B:98:D6:C1:52:D9:FD:A8:E9:27:1E:5B:BB:3A:E1:83:F6:41:32:EB:F1:2E:89:4A:BB`.
- The current upload certificate SHA-256 is
  `E3:37:81:33:08:6E:59:08:F5:53:76:8E:0C:B7:20:B7:8A:15:09:4B:94:A1:CF:99:03:D7:69:EF:81:EF:03:B8`.
  No matching private key was found in the repository, local release archives, or EAS.
- The user authorized replacement-key preparation on September 19. A new RSA-4096 upload
  keystore was generated and its private key verified locally. Its SHA-256 certificate is
  `EB:EF:98:9A:37:19:06:49:4B:D7:4B:24:D3:EE:89:AB:C9:17:FC:C0:6F:7E:4C:E5:AC:0C:EF:68:9A:F2:72:9C`.
  Private files are under `~/.config/yours-sincerely/android-upload-20260919/` with
  directory mode 0700 and file mode 0600. The public certificate is also in
  `~/Downloads/yours-sincerely-upload-certificate.pem` for the Play reset form.
- Play Console now shows a pending upload-key reset request, verified September 19 after
  the owner handoff. It still displays the old `E3:37:…:03:B8` upload certificate.
  The pending request does not expose its proposed certificate; confirm Play registers
  `EB:EF:…:72:9C` before activating the replacement in EAS. Google's app-signing key and
  installed-update identity stay unchanged.
- Inspect these under Play Console → Yours Sincerely → App integrity → App signing.
  Do not change the app-signing key or use the unrelated archived key for production.

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

Authenticated Play Console production history, checked 2026-09-19, contains codes
`111` (`1.1.1`, February 2023), `1` (`1.0 rewrite`, February 2023), and `30`
(`5.0`, June 2020). Code `30` still has an installed cohort. The archived code `40`
TWA does not appear in that production history; other tracks remain unverified.

Git introduced Capacitor on 2023-02-04 (`5b8f6a57`) and raised its Android version to
`1.1.1`/`111` on 2023-02-07 (`ba74553b`). Source matching code `30` at
`91559bb0` uses SuperView with standard Android WebView/CookieManager and the same live
HTTPS host. Its original web code used Firebase Auth; the remotely loaded current site
may since have issued a signed session cookie. App version alone cannot establish a
user's current credential format. No additional importer is justified by this source review.

Inspect Play's actual code `111` and `30` binaries and test in-place updates of working
identities from both. Source matching is not shipped-binary proof. If a shipped TWA cohort
is found, its browser-owned cookies require a separate transfer path:
[Chrome documents that the host app cannot read those cookies](https://developer.chrome.com/docs/android/trusted-web-activity).
Passing the Capacitor fixture alone does not close these gates.

## App links

The existing store identity is committed in `packages/contracts/src/mobile-identity.ts`.
It preserves iOS `com.tehkaiyu.yourssincerely` and Android `com.kyh.yourssincerely`.
It drives Expo configuration and both web association files.

The September 19 audit found that production `/.well-known/assetlinks.json` listed only
archived certificate `A5:4E:…:9C:24`. The source now also includes Play's actual
app-signing certificate `95:6E:…:4A:BB`, retaining the archive certificate for compatibility.
Commit `9afe91d1` deployed successfully; the public endpoint returned HTTP 200 with both
certificates on September 19. Physical Android link verification remains open.
Do not add the upload certificate: users receive binaries signed with the app-signing key.

## Notifications

Notifications are rows in the `Notification` table, written by the API when someone
replies to a letter, and pushed to phones through Expo's push service. No server-side
key: the server posts to `exp.host` unauthenticated and the device credentials live in
EAS.

- `RESEND_API_KEY`: Resend server API key for transactional email. Web/server only.
- `GOOGLE_SERVICES_JSON`: EAS file variable containing the Firebase Android app config for `com.kyh.yourssincerely`.
- iOS: APNs key, created and stored by EAS during `eas credentials` for production.
- Android: FCM V1 service-account key, uploaded to EAS as the production push credential, plus the file above.

Firebase Cloud Messaging API V1 is enabled for project `yours-sincerely`. On September 19,
with explicit owner approval, dedicated service account
`expo-push@yours-sincerely.iam.gserviceaccount.com` was created with only
`roles/firebasecloudmessaging.admin`. No broader Firebase Admin/Editor or Play access was
assigned. Its RSA-2048 key was generated locally; only its public X.509 certificate was
uploaded to Google. The private JSON is stored outside Git under
`~/.config/yours-sincerely/fcm-20260919/` (directory 0700, files 0600).

Google key `38d4be0f1200e055792209827dbd3951111a20fb` is active and expires
**September 19, 2027 at 10:15:46 UTC**. Rotate before expiry. Google OAuth authentication
and an FCM `validate_only` request both returned HTTP 200; no notification was delivered.
The JSON was uploaded and assigned to production Android `com.kyh.yourssincerely` in EAS,
credential `ed3905f3-2af6-47a1-b4dd-c758f814a93a`. A fresh EAS query confirmed assignment;
Play submission credentials and the production build keystore remain unassigned.

This private JSON differs from `google-services.json`. See
[Expo's FCM setup](https://docs.expo.dev/push-notifications/fcm-credentials/),
[Google's public-key upload](https://docs.cloud.google.com/iam/docs/keys-upload), and
[FCM validation-only requests](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages/send).

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
Production FCM V1 credentials are now verified as described above; physical push delivery
remains untested. Local `.env` is for development.

## Preserve store identity

Before the first production build:

- iOS: use the existing App Store Connect app and bundle ID `com.tehkaiyu.yourssincerely`. Seed EAS remote build version above the live Capacitor build number.
- Android: use the Play-registered upload keystore for `com.kyh.yourssincerely`. The original key is unavailable; the owner-authorized replacement must wait for reset approval and a matching certificate in Play Console > App integrity. Seed EAS remote version code above the live build.
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

# Mobile release inputs

Release prerequisites and remaining device checks. The current Expo candidate is still
under parity review; configured credentials alone do not establish release readiness.

Release audit, updated 2026-09-19:

- Production Vercel lists `COOKIE_SECRET`, `COOKIE_SECRET_LEGACY`, and `RESEND_API_KEY`.
  Secret values were not read. Presence does not prove that the legacy signer is correct.
- Production EAS lists `GOOGLE_SERVICES_JSON`; neither API override is listed.
- EAS has a finished production iOS build `964a431b-4302-414e-9004-fbca69923eeb`
  from 2026-09-05, version `2.0.0`, build `2026090503`. It predates the current changes.
- The user authorized source upload and builds, with no store submission. Both production
  candidates from clean main `598876ddca8c3bf1850833e1c793e15880be6338` finished on
  September 19. Downloaded artifacts passed the checks below, including the final profile
  corners and appearance-swatch shadow. These supersede iOS `2026090505` and Android
  `2026090502` from `a496f9c1`.
- EAS CLI 23.2.0 generated an Android keystore despite `--freeze-credentials`; the flag
  does not guard Android generation. Build `4b1db3e3-9bf4-4fdb-a0d7-2c3383c80751`
  (`2026090501`) was canceled with no artifact. Its newly generated key was removed and
  the preview credential was verified unchanged. Production Android now uses the explicitly
  authorized local replacement key, not an EAS-generated key.
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
  The production Android keystore is installed locally and was used for the finished build.
  Play submission credentials remain unassigned; no store submission is authorized.

## Verified production artifacts

Both artifacts contain version `2.0.0`, Hermes bytecode, and the production app identity.
Both include the profile-corner/swatch changes and production API host, with neither local port-3100
API URL present. Neither was submitted to a store. Artifact receipts:
`/tmp/ys-release-final-ui-artifacts-20260919/` (platform build metadata and verification JSON).

These artifacts predate the subsequent theme accessibility, navigation-wrapper, and Lottie
color fixes. Verify those fixes on the local native fixtures, then build replacement
production candidates before release.

- [iOS build `2026090506`](https://expo.dev/accounts/kaiyuhsu/projects/yours-sincerely/builds/927e6012-f4fd-46db-ad86-6e052baa43d6):
  strict code-signature verification passed; the actual signing certificate matches the
  provisioning profile. Existing certificate serial
  `689895EACC2EBD804073C5450A09F352`, team `N89P364V32`, production APNs entitlement,
  no debugging, iPhone/iPad support. Provisioning expires September 5, 2027 at 16:45:51 UTC.
  IPA SHA-256: `57403dee3d5c8b23a6b095ecebb525c5433d99d70a0467e9b2c083e3cde3621c`.
- [Android build `2026090503`](https://expo.dev/accounts/kaiyuhsu/projects/yours-sincerely/builds/d2acebb0-cafb-439f-ab1c-5b4dacf7c4e7):
  JAR signature and bundletool validation passed; signer matches the replacement upload
  certificate below. Target SDK 36, minimum SDK 24, Firebase project `yours-sincerely`,
  notification permission present, overlay permission absent, debugging disabled.
  All 50 bundled arm64-v8a/x86_64 libraries have ELF load-segment alignment of at least
  16 KB. No bundled keystores or `.credentials/` entries were found. This is artifact validation,
  not a 16 KB device runtime test.
  AAB SHA-256: `ab3ae033949b78e0e26c3cefb93011ef586b1dd186886aa36636d293776af47e`.

## Play Console signing

Verified 2026-09-19:

- Play manages app signing. Its SHA-256 certificate is
  `95:6E:8F:3D:D8:7D:49:0B:98:D6:C1:52:D9:FD:A8:E9:27:1E:5B:BB:3A:E1:83:F6:41:32:EB:F1:2E:89:4A:BB`.
- The previous upload certificate SHA-256 was
  `E3:37:81:33:08:6E:59:08:F5:53:76:8E:0C:B7:20:B7:8A:15:09:4B:94:A1:CF:99:03:D7:69:EF:81:EF:03:B8`.
  No matching private key was found in the repository, local release archives, or EAS.
- The user authorized replacement-key preparation on September 19. A new RSA-4096 upload
  keystore was generated and its private key verified locally. Its SHA-256 certificate is
  `EB:EF:98:9A:37:19:06:49:4B:D7:4B:24:D3:EE:89:AB:C9:17:FC:C0:6F:7E:4C:E5:AC:0C:EF:68:9A:F2:72:9C`.
  Private files are under `~/.config/yours-sincerely/android-upload-20260919/` with
  directory mode 0700 and file mode 0600. A verified local-repo copy is now in
  `.credentials/production/android/`; the public certificate is committed at
  [`certificates/android-upload.pem`](./certificates/android-upload.pem).
- The owner submitted the reset. Play Console now displays the matching
  `EB:EF:…:72:9C` upload certificate. Its confirmation says the new key becomes valid
  **September 21, 2026 at 10:11 UTC (03:11 America/Los_Angeles)**; uploads are blocked
  until then. The request still shows pending. This delay blocks Play uploads, not EAS
  compilation/signing; the verified AAB above already uses the replacement key.
  Google's app-signing key and installed-update identity stay unchanged.
- Inspect these under Play Console → Yours Sincerely → App integrity → App signing.
  Do not change the app-signing key or use the unrelated archived key for production.

For install commands and the exact upgrade test, use [phone testing](./phone-testing.md).

## Credential files and recovery

The local checkout contains the complete Android signing and FCM credential bundle in
**`.credentials/production/`**. Git ignores this entire directory. Private files are mode
0600; directories are mode 0700. No private keys or passwords are committed or included
in the normal EAS source archive. EAS uploads the selected local signing credential
separately when a build is requested.

| Local file                       | Purpose                                                  |
| -------------------------------- | -------------------------------------------------------- |
| `android/upload-keystore.jks`    | Replacement Play upload private key; alias `upload`      |
| `android/credentials.json`       | Keystore password, key password, alias, and path for EAS |
| `android/upload-certificate.pem` | Public certificate submitted to Play                     |
| `fcm/service-account.json`       | Complete FCM V1 credential already assigned in EAS       |
| `fcm/private-key.pem`            | Original FCM private key, also contained in the JSON     |
| `fcm/public-certificate.pem`     | Public certificate registered with Google                |
| `google-services.json`           | Firebase Android config for `com.kyh.yourssincerely`     |

Android `credentials.json` is already installed in ignored `apps/expo/credentials.json`;
its keystore path resolves relative to that directory. To restore it and create a future
build, run from the repository root. The finished candidate above needs no rebuild solely
because the Play key activates later:

```sh
install -m 600 .credentials/production/android/credentials.json apps/expo/credentials.json
cd apps/expo
APP_VARIANT=production eas build --profile production --platform android
```

This builds only; do not run `eas submit` without separate store-submission authorization.
Production `GOOGLE_SERVICES_JSON` remains configured in EAS. The local Firebase config
matches its project/package; it is separate from the FCM service-account credential.
To restore FCM in EAS, run `APP_VARIANT=production eas credentials --platform android`
from `apps/expo`, select production → Google Service Account → Push Notifications
(FCM V1), and supply `../../.credentials/production/fcm/service-account.json`.

A fresh Git clone does **not** contain private credentials. Transfer the ignored bundle
through a secure channel and preserve permissions; keep an encrypted off-machine backup
of it. The original copies in `~/.config/yours-sincerely/` are on this same computer,
so they do not protect against losing the computer. Do not force-add `.credentials/`.

Apple distribution/provisioning/APNs credentials remain managed in EAS, under the existing
Apple team; they were not exported into this Android/FCM bundle. Web `COOKIE_SECRET`,
`COOKIE_SECRET_LEGACY`, and `RESEND_API_KEY` remain in the web deployment. They are not
native build inputs. Public certificates, app IDs, EAS configuration, fingerprints, and
recovery instructions are tracked in Git.

## Session continuity

- `COOKIE_SECRET`: current production web session signer.
- `COOKIE_SECRET_LEGACY`: only needed after rotation. Keep the signer used by the live Capacitor build in this comma-separated verification-only list.

These are web/server secrets, not EAS values. Losing the legacy signer invalidates old Capacitor sessions before Expo can migrate them.

### Android runtime provenance

The archived `Yours Sincerely.apk` and `.aab` beside the recovered key are PWABuilder
Trusted Web Activity builds (`1.1.0.0`, APK code `40`), with a trusted-browser launcher,
`generatorApp=PWABuilder`, `fallbackType=customtabs`, and `https://yourssincerely.org/`.
They establish the signing certificate, not the current Play runtime.

Authenticated Play Console's complete app-bundle inventory, checked 2026-09-19, lists
three versions: `111` (`1.1.1`, active), `1` (`1.0`, inactive), and `30` (`5.0`, inactive).
All three signed universal APKs were downloaded from Play and passed `apksigner verify`;
all use package `com.kyh.yourssincerely` and the Play app-signing certificate above.
The archived TWA code `40` is absent from this inventory.

| Play code | APK SHA-256                                                        | Verified shipped runtime                                                                                       |
| --------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 111       | `8b7fae151ae6b97f5f6e0df8b081de8ea097109afaf789e93f86789551e305ec` | Capacitor `BridgeActivity`; server `https://yourssincerely.org`                                                |
| 1         | `3d1abe2035b37a1448edac345de9304d731bf0fdce9b057ade9f2db392fdd352` | Capacitor `BridgeActivity`; server `https://yourssincerely.org`                                                |
| 30        | `80c5e68cc6023befe6301a31fecec5aef6d9d965695e36175a285fc14ae91038` | SuperView `AppCompatActivity`; standard Android WebView/CookieManager; target URL `https://yourssincerely.org` |

The current importer reads the app-owned WebView cookie store used by these binaries.
That establishes the runtime path, not the validity of any user's stored cookie. Code 30's
original web code used Firebase Auth; the remotely loaded current site may since have
issued a signed session cookie. App version alone cannot establish the credential format.
No additional importer is justified by this binary inspection.

Play reports an install base of `≤100` for each of codes 1 and 30; that does not establish zero users. Test working
identities from older cohorts as well as code 111 with an in-place, store-delivered update.
If an unlisted shipped TWA cohort is later found, its browser-owned cookies need a separate
transfer path: [Chrome documents that the host app cannot read those cookies](https://developer.chrome.com/docs/android/trusted-web-activity).
Passing the Capacitor fixture alone does not close the physical upgrade gates.

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
`~/.config/yours-sincerely/fcm-20260919/` and copied into the ignored repo folder
`.credentials/production/fcm/` (directories 0700, files 0600). Its
[public certificate](./certificates/fcm-push.pem) is committed.

Google key `38d4be0f1200e055792209827dbd3951111a20fb` is active and expires
**September 19, 2027 at 10:15:46 UTC**. Rotate before expiry. Google OAuth authentication
and an FCM `validate_only` request both returned HTTP 200; no notification was delivered.
The JSON was uploaded and assigned to production Android `com.kyh.yourssincerely` in EAS,
credential `ed3905f3-2af6-47a1-b4dd-c758f814a93a`. A fresh EAS query confirmed assignment;
Play submission credentials remain unassigned. The production build uses the local
Android keystore; no remote EAS keystore is required.

This private JSON differs from `google-services.json`. See
[Expo's FCM setup](https://docs.expo.dev/push-notifications/fcm-credentials/),
[Google's public-key upload](https://docs.cloud.google.com/iam/docs/keys-upload), and
[FCM validation-only requests](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages/send).

Then use physical devices to opt in, receive a notification, and open its exact post.

## Store declarations

Play's Test and release dashboard showed three required declarations on September 19:
financial features, health apps, and child safety standards. No declarations were submitted.

Current app/API code supports draft answers of no financial features and no health features;
confirm any services outside the repository before attesting. Child safety needs owner facts:
a published CSAE standards URL, a designated monitored safety contact, and the actual
report-review, removal, and escalation process. Existing terms prohibit illegal/explicit
content; generic support email and automatic flag-based hiding do not establish those facts.
The report action opens email; existing identities can also flag posts inside the app.
No staffed review workflow is documented. See
[Google's child-safety declaration requirements](https://support.google.com/googleplay/android-developer/answer/14747720).

Android developer verification lists `com.kyh.yourssincerely` as **Registered**, with one
key and last-updated date March 6, 2026, verified in the live package table on September 19.
The account-wide September 30 registration reminder therefore needs no package-registration
action for this Play app. The new Android candidate targets API 36, but successful build
validation does not establish Play policy clearance.

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
- Android: use the Play-registered upload keystore for `com.kyh.yourssincerely`. The original key is unavailable; the owner-authorized replacement matches Play Console > App integrity and signed the current candidate. Play uploads must wait for its September 21 activation. Seed EAS remote version code above the live build.
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

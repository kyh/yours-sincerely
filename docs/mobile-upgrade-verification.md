# Real legacy-to-Expo upgrade verification

Verified September 19, 2026 against the local web app and OrbStack database.

Both platforms passed real UI publish → legacy cold restart → publish → in-place Expo
update → publish → Expo cold restart → publish. No session was injected. No uninstall or
data reset occurred between the legacy and Expo builds. Database author IDs establish
continuity; seeing the same public feed alone would not.

## iOS

- iPhone 17 simulator, iOS 26.5; device `903DF5D3-7E05-4F13-AE7E-3A6C6E657BE6`.
- Historical native source `ba74553bec18f4aa4fe0754d60de8e83ed9ae288` (February 7, 2023),
  Capacitor 4.6.3 and exact historical lockfile dependencies. Original bundle ID
  `com.tehkaiyu.yourssincerely`, version 1.1.1/build 1.
- Rebuilt for arm64 simulator with current Xcode. Fixture changes: localhost server URL,
  local-network ATS permission, and build-time iOS 15 deployment target required by Xcode.
  This is historical source, not the encrypted App Store binary.
- Expo Release/Hermes from main `12a2e0c0`, same bundle ID, local signing, local API,
  and fixture-only migration host `localhost`. Native cookie-reader code unchanged.
- All four posts retained user `3243aed8-e6b5-4aa9-a856-a373b40790f6`:

| Phase                | Local post ID                          |
| -------------------- | -------------------------------------- |
| Legacy first post    | `1f176ef3-bdf0-48d2-86f7-57b9ae0449d9` |
| Legacy after restart | `0847a524-67e8-4ac0-9ea2-10f1b48ce5fe` |
| Expo after update    | `7ae27725-0001-46aa-9fd4-241cc1c587cb` |
| Expo after restart   | `c92c7a64-3b42-4839-a9a1-682ab511a64c` |

The backend stopped before the first Expo launch. Restoring it and tapping Try again
recovered the feed; subsequent writes retained the same identity. No migration reset or
session repair was needed.

Local detailed evidence: `/tmp/ys-ios-genuine-upgrade-20260919-evidence.json`.
Historical artifact provenance: `/tmp/ys-ios-shipped-source-20260919/FIXTURE.md`.

## Android

- Pixel 6 emulator, API 35, disposable read-only AVD overlay.
- Actual Play code 111 APK; only its Capacitor server URL was changed to localhost.
  DEX and AndroidManifest remained byte-identical; both old and new APKs were signed with
  the same fixture debug key. Cleartext support already existed in the old manifest.
- Expo Release/Hermes from main `12a2e0c0`, code 112, same production package
  `com.kyh.yourssincerely`, local API and fixture-only migration host `localhost`.
- `adb install -r` retained the original install time and application data.
- Four posts retained user `8a0a0a58-435a-4518-9974-f10fa89bd647`:

| Phase                    | Local post ID                          |
| ------------------------ | -------------------------------------- |
| Legacy persisted session | `9b3157fa-75ec-48f9-ac34-2559eef58641` |
| Legacy after restart     | `e42286f0-e61f-41ea-bdf1-e22b228e2186` |
| Expo after update        | `cfb9faf1-c818-432a-b648-7aac65a11942` |
| Expo after restart       | `bdb42266-f0f0-4c18-97ad-5c37d36542cc` |

The persistent legacy cookie was verified on disk before restart. Expo imported it and
cleared the legacy row; it remained cleared after Expo restarted. Native restart retained
the same author. No migration warning or fatal error appeared in the captured native log.

An earlier first legacy post used user `bf1c384c-2c27-4d68-9d2c-15bca01a172e`; an immediate
force-stop lost that identity. Its cookie's disk state was not captured, so the cause is
unproven. This anomaly is separate from the subsequent persisted-session upgrade pass.
Do not call first-write persistence in the old app proven by this run.

The historical APK also exposed an unavailable `App` plugin call from today's web code.
The web provider now checks Android platform and plugin availability before registering
the back handler. Legacy Home, composer, and publish worked after the fix; the missing
plugin rejection disappeared.

Local detailed evidence and screenshots:
`/tmp/ys-android-genuine-upgrade-20260919/README.md` and `runtime-evidence.json`.

## Keyboard follow-up

Android API 35 passed editor exclusion and Right/Left/Space stack navigation after native
Back dismissed the keyboard and composer, without refocusing or restarting. Ctrl+Enter
opened Android Studio's host New popup; no post was created. That modifier check remains
unverified. No user-wide shortcuts were changed; the temporary draft was cleared.

## Remaining release evidence

These tests establish local session migration. They do not establish physical store
update delivery, production push, verified HTTPS links, or production crash collection.
Those gates remain in [phone testing](./phone-testing.md) and the
[release checklist](./wayfinder/expo-mobile-parity/07-release-gate.md).

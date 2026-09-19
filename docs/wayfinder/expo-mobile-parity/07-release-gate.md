# 07 Release gate

- [x] API security contract tests.
- [x] Legacy migration unit tests.
- [x] Expo-tested native dependency versions.
- [x] Signed iOS Hermes build and route smoke.
- [x] Android Release APK build and cold launch.
- [x] Android legacy-session upgrade journey (emulator; Play-delivered phone still pending).
- [x] Automated Capacitor-to-Expo upgrade fixture (docs/phone-testing.md §3).
- [x] Current iOS candidate built with existing production signing credentials; IPA verified.
- [ ] Current Android candidate built with a key matching Play’s registered upload certificate.
- [ ] Identify shipped Android runtimes, including whether any PWABuilder/TWA version shipped.
- [ ] Store-delivered Capacitor upgrade preserves identity on physical iOS and Android.
- [x] Fresh anonymous write, restart, and sign-up preserve the same user ID on iOS.
- [x] Fresh anonymous write, restart, and sign-up preserve the same user ID on Android.
- [ ] Hardware keyboard commands, editor exclusion, and modal dismissal verified natively.
- [ ] Physical push opens its exact post on both platforms.
- [ ] Production Android association JSON includes the verified Play app-signing certificate.
- [ ] Verified HTTPS links work cold, warm, and after backgrounding on both platforms.
- [ ] Production crash diagnostics verified.

Local Release builds and staged-cookie fixtures do not close the physical store gates.
Play Console production history was verified on 2026-09-19: codes 111, 1, and 30;
code 30 retains an installed cohort. The archived TWA code 40 is absent from that history.
Source matching code 30 uses a standard WebView; inspect the actual binaries and exercise
working identities from both code 111 and code 30 before claiming Android continuity.
The recovered archive key differs from Play's upload key, which remains missing. The
verified Play app-signing certificate is now in source; web deployment remains pending.
See [release inputs](../../mobile-release-inputs.md).
Both the earlier iOS fixture and a fresh simulator install preserved an anonymous ID across
write/restart/write. The fresh install then completed native sign-up with the same author ID
and both posts intact; Settings retained the upgraded email after another restart. Evidence:
`/tmp/ys-ios-fresh-signup-evidence.json`. iOS Command-Enter,
stack keys, editor exclusion, and settled modal dismissal passed. Android Left/Right/Space
stack navigation, composer editor exclusion, and native Back dismissal passed on API 35.
A fresh Android overlay
also passed write/restart/write/sign-up/restart with the same user and both letters intact;
Settings showed the upgraded email. Evidence: `/tmp/ys-android-final-check.md` and
`/tmp/ys-android-signup-restart-settings.xml` with its PNG. Android Ctrl+Enter was intercepted
by Studio; modifier submission and hardware stack navigation after dismissal remain open.
See [phone testing](../../phone-testing.md) for the required evidence.

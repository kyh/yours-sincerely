# 07 Release gate

- [x] API security contract tests.
- [x] Legacy migration unit tests.
- [x] Expo-tested native dependency versions.
- [x] Signed iOS Hermes build and route smoke.
- [x] Android Release APK build and cold launch.
- [x] Android legacy-session upgrade journey (emulator; Play-delivered phone still pending).
- [x] Automated Capacitor-to-Expo staged-cookie fixture (docs/phone-testing.md §3).
- [x] Real legacy UI posts survive restart, in-place Expo upgrade, and native restart on both platforms.
- [x] Current iOS candidate built with existing production signing credentials; IPA verified.
- [x] Current Android candidate built and verified with the registered replacement upload certificate.
- [x] Inspect all three Android artifacts listed in Play: Capacitor 111/1 and WebView 30; no TWA listed.
- [ ] Store-delivered Capacitor upgrade preserves identity on physical iOS and Android.
- [x] Fresh anonymous write, restart, and sign-up preserve the same user ID on iOS.
- [x] Fresh anonymous write, restart, and sign-up preserve the same user ID on Android.
- [x] iOS Command-Enter and both platforms' stack navigation, editor exclusion, and modal dismissal verified locally.
- [ ] Android Ctrl+Enter verified on a host/device that forwards the modifier.
- [ ] Physical push opens its exact post on both platforms.
- [x] Production Android association JSON includes the verified Play app-signing certificate.
- [ ] Verified HTTPS links work cold, warm, and after backgrounding on both platforms.
- [ ] Production crash diagnostics verified.
- [ ] Play upload-key activation confirmed (September 21, 2026 at 10:11 UTC).
- [x] Android developer verification lists the production package as Registered.
- [ ] Required Play financial, health, and child-safety declarations completed.

Real legacy UI upgrade tests passed on iOS 26.5 and Android API 35 on September 19.
Each platform retained one author across four UI posts, including legacy and Expo restarts.
See [artifact provenance, database receipts, and the early Android legacy-session anomaly](../../mobile-upgrade-verification.md).
These local builds do not close the physical store gates.
Play's complete artifact inventory was inspected on 2026-09-19: codes 111, 1, and 30.
Their actual Play-signed APKs were verified: 111/1 use Capacitor; 30 uses a standard
WebView/CookieManager; all load the production host. The archived TWA code 40 is absent.
Older cohorts remain listed. Exercise their working identities in place before claiming
Android continuity. Both production candidates from main `a496f9c1` finished and passed
artifact verification: iOS `2026090505`, Android `2026090502`.
The recovered archive key differs from Play's original upload key. Its replacement is
stored locally in the ignored credential bundle; Play confirms activation on September 21
at 10:11 UTC. EAS compilation/signing is complete; only Play uploads wait for activation.
FCM V1 is assigned and its validation-only request passed. The verified Play
app-signing certificate is deployed; the public JSON was checked on September 19.
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
by Studio. On September 19, Android Right/Left/Space navigation after settled composer
dismissal passed without refocusing the canvas, and editor exclusion passed again.
Ctrl+Enter still opened Studio's New popup and created no post; modifier submission remains
unverified. No user-wide Studio shortcuts were changed.
See [phone testing](../../phone-testing.md) for the required evidence.

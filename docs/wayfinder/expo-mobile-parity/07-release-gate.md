# 07 Release gate

- [x] API security contract tests.
- [x] Legacy migration unit tests.
- [x] Expo-tested native dependency versions.
- [x] Signed iOS Hermes build and route smoke.
- [x] Android Release APK build and cold launch.
- [x] Android legacy-session upgrade journey (emulator; Play-delivered phone still pending).
- [x] Automated Capacitor-to-Expo staged-cookie fixture (docs/phone-testing.md §3).
- [x] Persisted legacy UI sessions survive restart, in-place Expo upgrade, and native restart on both platforms.
- [x] Play code 1 persisted-session upgrade passes the same four-post journey.
- [x] Play code 30 persisted-session upgrade passes all four old/native UI posts and both restarts.
- [x] Fresh-session persistence fix passes immediate first-post → Expo replacement on Android codes 111 and 1.
- [x] Deploy verified web persistence fix before rollout; document remaining unbridged/old-page interruption risk.
- [x] Build iOS candidate from `a4febf06` with existing production credentials; verify its IPA.
- [x] Build Android candidate from `a4febf06` with the registered replacement upload certificate; verify its AAB.
- [x] Inspect all three Android artifacts listed in Play: Capacitor 111/1 and WebView 30; no TWA listed.
- [ ] Store-delivered Capacitor upgrade preserves identity on physical iOS and Android.
- [x] Fresh anonymous write, restart, and sign-up preserve the same user ID on iOS.
- [x] Fresh anonymous write, restart, and sign-up preserve the same user ID on Android.
- [x] iOS Command-Enter and both platforms' stack navigation, editor exclusion, and modal dismissal verified locally.
- [x] Fresh-install like creates a profile and preserves the same identity through restart and sign-up on both platforms.
- [x] Another writer's profile is read-only on both platforms.
- [ ] All four theme variants pass native visual, accessibility, transition, and persistence checks.
- [x] iOS card-stack swipe advances the visible card with working gesture input.
- [ ] iOS native back gesture verified after the theme-wrapper fix.
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
See [artifact provenance, database receipts, and reproduced fresh-session loss](../../mobile-upgrade-verification.md).
An immediate update 12.953 seconds after a fresh legacy first post lost its unpersisted
identity. The scoped web/native flush barrier now passes immediate-update regressions on
111 and 1 at 10.821 and 10.748 seconds respectively, including native restarts. Do not claim
unconditional session continuity: code 30 has no bridge, and an old loaded page or process
death before the barrier completes remains outside this mitigation.
Commit `598876dd` passed CI and deployed to production. The public home page returned
HTTP 200 and served the persistence barrier in its referenced JavaScript chunk on
September 19. These local builds do not close the physical store gates.
Play's complete artifact inventory was inspected on 2026-09-19: codes 111, 1, and 30.
Their actual Play-signed APKs were verified: 111/1 use Capacitor; 30 uses a standard
WebView/CookieManager; all load the production host. The archived TWA code 40 is absent.
Codes 1 and 30 now pass all four persisted-session UI writes, including both restarts and
in-place Expo installation. All three listed Android cohorts have local migration proof.
Both production candidates from main `a4febf06` finished and passed
artifact verification: iOS `2026090507`, Android `2026090504`. They include the inherited
color, accessibility, navigation-wrapper and icon corrections. Native checks still open
below remain release gates; neither artifact was submitted to a store.
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

Like-first identity and profile ownership checks passed on both platforms on September 19;
see [identity receipts](./02-identity-continuity.md) and [profile checks](./03-profile-release.md).
Theme fixes now preserve root wrappers, inherited colors, individual accessibility controls,
and light/dark navigation icon colors. The installed CSS resolver regressions and full
`pnpm verify` pass. All four iOS themes pass transitions and cold-launch persistence with
the same account. Android launches with its retained account and individual controls, but
Studio's computer-use connection currently rejects taps. Alternate emulator input awaits
explicit permission. iOS drag control tests also fail in Apple Settings and on the Home
Screen, so the failed automated swipe does not establish an app navigation defect. A separate
simulator-only XCTest diagnostic is compiled, awaiting permission to run alternate input.
Android theme checks and iOS native back verification remain open.
Evidence: `/tmp/ys-theme-fix-20260919/propagation-fixed/ios-runtime-evidence.json`.

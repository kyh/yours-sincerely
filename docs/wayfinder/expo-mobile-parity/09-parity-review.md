# Web / Expo parity review

Reviewed 2026-09-12. Web is the reference for behavior, content, and visual design.
Expo uses native controls, keyboards, gestures, scrolling, sharing, and accessibility.
Implementation and local verification are recorded below. Physical release gates remain open.

## Scope

Compared all web routes and API operations: feed, stack, letters, replies, compose,
reactions, moderation, sharing, authentication, recovery, profiles, calendar, settings,
blocked writers, notifications, themes, and links. Every web API operation already had
an Expo consumer. Most gaps were interaction, recovery, and presentation.

## Implemented

Source paths below are relative to `apps/expo/src`.

- **Shell:** one native `Stack` retains route history inside persistent header/menu/navigation.
  Phone bottom navigation; sidebar and inline list composer at 768px; web content widths
  and wider aside breakpoint. `components/layout/app-shell.tsx`, `app/_layout.tsx`.
- **Feed / stack:** full letters everywhere; cached content survives refresh/pagination
  failures; explicit retries and refreshable empty state. Stack mounts current/two ahead/one
  behind, ignores cancelled gestures, excludes hidden cards from interaction, and bounds
  long-letter scrolling. Removed card-order wrapper elevation; only paper casts a shadow.
  `components/post/post-feed.tsx`, `card-stack.tsx`, `components/ui/card.tsx`.
- **Letters / replies:** virtualized comments, selectable text, keyboard-safe replies,
  wrapping author names, regular italic signatures with dotted underlines, and horizontal
  footers at 640px. `app/posts/[post-id].tsx`, `components/post/post-content.tsx`.
- **Compose:** shared draft across letters/replies; late restoration cannot overwrite typing.
  Signature matches web dimensions with an enlarged invisible touch target. Phone input
  uses 25–60% viewport bounds; dialog input starts at 120px and grows.
  `components/post/post-form.tsx`.
- **Dialogs / menus:** New Post switches to a centered 448px dialog at 640px: 24px padding,
  close button, blur, keyboard-aware scrolling, and 100ms transition with reduced-motion
  support. More uses a zero-padding dialog with centered 66px divided rows. Delete acts
  immediately; menu actions retain the menu as on web. Avatar uses a 160px anchored menu
  at 640px. `components/ui/dialog.tsx`, `components/post/new-post-button.tsx`,
  `more-button.tsx`, `components/layout/avatar-menu.tsx`.
- **Reactions / celebration:** 16px counts, web heart color and particle easing, guarded
  in-flight likes, visible failures, non-overlapping timer sectors, and a measured expiry
  tooltip instead of a toast. Balloons match viewport-dependent count/size, depth order,
  1500px perspective, stagger, blur threshold, and 25–30-second travel.
  `components/post/like-button.tsx`, `timer-button.tsx`, `components/animations/`.
- **Auth / identity:** safe return destinations, typed letter/profile routes, keyboard Next/Go,
  scrollable forms, and empty-token rejection. Account changes release previous push identity;
  lookup failure no longer unregisters push. `app/auth/`, `lib/next-route.ts`,
  `components/notifications/`.
  Legacy-session import failures now block API requests and retry instead of permitting a
  fresh anonymous identity. Tests cover native read, SecureStore write/checkpoint failure,
  concurrent requests, raw cookie preservation, and missing production bridge.
  `lib/legacy-session-migration.ts`, `lib/api-fetch.test.ts`.
  Identity-changing and identity-creating requests are serialized; reads remain concurrent.
  Response generations prevent older renewals from replacing a login or restoring logout.
  Stale workspace results cannot delete a newer cookie. SecureStore writes/removals are
  verified, failed writes retry before further traffic, and legacy retirement is persisted
  before cookie deletion. `lib/api-session-races.test.ts`, `lib/session-store.test.ts`.
- **Hardware keyboard:** local native view scopes handle Ctrl/Cmd+Enter publishing and
  unmodified left/right/space stack navigation. Editors, inactive routes, and presented
  modals exclude stack commands. No global interception or new dependencies.
  `modules/keyboard-shortcuts/` (relative to `apps/expo`), `components/post/`.
- **Account / notifications:** public profile heading, 200-day tablet calendar, scrollable
  phone calendar, labeled statistics; web settings grouping, saving/errors, cached data,
  serialized actions, offline logout; saved blocked-writer avatars and retry; notification
  avatars, unread styling/copy, cached rows and recovery. `components/profile/`,
  `components/settings/blocked-writers.tsx`, `app/settings.tsx`, `app/notifications.tsx`.
  Account deletion uses the same confirmation copy and centered dialog as web.
- **Shared UI:** web 16px root, spacing, Inter weights, palette/radius tokens, button/input
  dimensions, invisible touch expansion, complete scroll-container spacing, blurred
  keyboard-aware drawers, and themed banners/toasts. Theme changes preserve navigation.
  Single-line iOS fields explicitly clip instead of wrapping at spaces/hyphens when blurred;
  multiline letter inputs retain wrapping.
  `styles.css`, `components/ui/`, `components/theme-provider.tsx`.

## Verification status

- September 19 release audit authenticated Play Console and verified its app-signing and
  upload certificates. The archived key matches neither. Fixed the missing Play app-signing
  certificate in the web association response while preserving the archive certificate.
  The real route handler check and full `pnpm verify` passed on main. Commit `9afe91d1`
  deployed successfully; the public endpoint returned HTTP 200 with the correct certificate.
  Evidence:
  `/tmp/ys-main-release-verify-20260919.log`.

- Final `pnpm verify` passed: typecheck, lint, formatting, **210 tests** (67 Expo), and
  web build. Repeated after the single-line input fix; evidence:
  `/tmp/ys-release-input-verify.log`.
- Current native builds passed: Android Debug, iOS Debug, and standalone iOS Release
  simulator build. The Release simulator used the preview bundle ID and local API;
  it is not a production-signed store artifact.
- Additional standalone Release builds passed with the production app IDs, local API,
  simulator/debug signing, and the keyboard module. Android's disposable fixture adds a
  localhost-only HTTP exception; distributed production configuration is unchanged.
  Evidence: `/tmp/ys-release-session-ios-final-source.log`,
  `/tmp/ys-release-session-android-final-source.log`. The generated HTTP exception was removed.
  Android Release also rebuilt after the input fix with the default API configuration:
  `/tmp/ys-release-android-input-fix.log`. This compile check remains locally debug-signed.
- The production-ID iOS Release fixture imported and retired a staged legacy binary cookie.
  Android's clean legacy WebView fixture persisted the exact local-account cookie, received
  an in-place Expo Release update, created SecureStore data, and retired the legacy row.
  Its encrypted session remained unchanged after force-stop/relaunch, and authenticated
  API requests resumed. The final two asynchronous deletion guards have deferred regression
  coverage and rebuilt bundles; another native UI pass remains pending.
  These are local fixtures, not store-signature or physical-device proof.
- `lib/native-styles.test.ts` exercises the real Tailwind → PostCSS → native compiler
  and runtime style resolver, in optimized and unoptimized modes:
  16px text, 24px line height, 20px gutters, 44px target utilities, and web radii.
  `components/animations/balloon-scene.test.ts` checks scene density and projection.
- Avatar SVGs and navigation Lottie JSON were compared byte-for-byte with web. Four palettes
  are covered by `lib/theme-palette.test.ts`; Turbo includes the web stylesheet as test input.
- Local web references: 412×915, 768×1024, and 1024×1366, covering list, stack, compose, and
  menus. Browser viewport emulation does not verify a software keyboard.
- Earlier iOS/Android samples covered publishing, replies, notifications, themes, and
  recovery against OrbStack local Supabase. No production data was changed.
- Final Android API 35 checks: signup validation/focus with keyboard, blurred menu,
  stack swipe and Previous, paper-only shadows; 1024dp tablet shell, 160px avatar dropdown,
  centered 448px composer, and keyboard-visible controls. Display overrides were restored.
- Standalone iOS 26.5 checks: feed/detail, expiry tooltip/dismissal, compose keyboard
  reachability, draft close/reopen, menu, stack Next and Previous. Local draft was cleared.
- Final production-ID iOS Release update retained the migrated local account in Settings.
  The rebuilt input fix rendered its long hyphenated email on one line before and after
  editing, plus a multi-word display name and signature. Build evidence:
  `/tmp/ys-release-session-ios-input-fix.log`.
- EAS production iOS build `b4684f7f-ed6f-42a4-8878-a476650daf9d` finished: version `2.0.0`,
  build `2026090504`. The downloaded IPA passed strict code-signature verification and
  matched the existing distribution certificate, Apple team, app ID, production push
  entitlement, and iPhone/iPad support. Cloud logs confirm both local native modules were
  installed and the production environment validator passed. No store submission occurred.
- iOS hardware-keyboard checks passed for left/right/space stack navigation, editor
  exclusion, blocking navigation behind the avatar drawer, and navigation after settled
  composer publish/cancel. Command-Enter published exactly one local letter, verified in
  Postgres. Focus changes and drawer transitions must settle before sending the next key;
  earlier automation timing misses did not reproduce as app bugs.
- Android API 35 Left/Right/Space stack navigation passed through Android Studio's
  embedded emulator. Control-Left did not change the card; host forwarding of the modifier
  was not independently verified. Paper-only shadows remained subtle. This used the
  production-ID local-API Release fixture in a read-only AVD overlay, not a physical device.
  Studio coordinate taps and some toolbar actions were unreliable, so composer submission,
  editor exclusion, and modal dismissal were not marked passed. No app change was inferred
  from those automation failures.
- A fresh anonymous iOS write, force-stop/relaunch, and second write produced two letters
  with the same author ID (`c252d20a-d870-49f9-aa02-089db91220db`), verified in local Postgres.
  This checks native persistence after logout; fresh-install and native sign-up continuity
  remain separate release checks.
- A subsequent fresh simulator install (iOS 26.5, device
  `A521F7A7-CB12-465F-A6C4-10DD12AF69E8`) also passed write/terminate/relaunch/write.
  Local Postgres confirmed both letters belong to `1543b7a8-020e-4922-b68a-82d267a5c367`,
  initially with no email assigned. On resumption, native sign-up assigned
  `ios1812@ys.local` to that same user and retained both posts. After another terminate/relaunch,
  native Settings displayed the upgraded email. Evidence: `/tmp/ys-ios-fresh-signup-evidence.json`.
  Initial simulator startup delays resolved without an app change. Synthesized typing lost
  characters; native accessibility `setValue` filled exact values and the actual sign-up
  mutation succeeded. No app text-input fix was inferred from the automation issue.
- Android's fresh disposable overlay cold-launched the verified local-only Release APK.
  Studio attachment required both `-no-window` and `-qt-hide-window`, plus authenticated
  gRPC; gRPC alone was insufficient. The Mac locked before interactive checks, so no new
  keyboard/editor/modal or identity-continuity pass is claimed. The overlay was stopped;
  the base AVD was unchanged. Evidence: `/tmp/ys-android-final-check.md`.
- A resumed Android API 35 overlay passed native anonymous write/restart/write/sign-up/
  restart. Both letters retained author `8e4b779e-66a9-4127-92ee-87d02decf6b0`; sign-up
  assigned `android2052@ys.local` to that same user. Settings displayed that email after
  relaunch. Evidence: `/tmp/ys-android-signup-restart-settings.xml` and its PNG.
  Composer editor exclusion passed: typing `AZ`, Left, then Space produced `A Z` without
  advancing the underlying stack. Native Back dismissed the keyboard and composer; the
  same stack card remained. Ctrl+Enter opened Studio's host New menu, so modifier forwarding
  remains unverified. No application source change was inferred from it. Full evidence:
  `/tmp/ys-android-final-check.md`. The owned overlay and local API were stopped afterward.
- iOS drag automation did not move even the ordinary feed list. Swipe/drag and bezel-back
  verification remain device checks; these attempts do not prove gesture failure or success.
- Metro required a clean cache after SDK peer-path changes and new utilities. Development
  cache failures were reproduced and resolved; the standalone iOS bundle rendered correctly.

## Remaining boundaries

- Play production history contains Android codes 111, 1, and 30; code 30 remains installed.
  Git matching code 30 uses a standard WebView, but its original web auth used Firebase.
  Inspect the Play binaries and update working identities from both old cohorts in place.
  The archived TWA code 40 is absent from production history; other tracks are unverified.
  Any demonstrated TWA cohort needs browser-assisted migration because its cookies are
  outside the native WebView importer.
- Hardware shortcuts compile on both platforms. iOS Command-Enter and stack/editor/modal
  behavior passed locally. Control-Enter opened the simulator's edit menu; Command-arrows
  rotated Simulator even with keyboard capture enabled. These attempts do not verify the
  device modifier behavior. Android stack keys, native Publish, editor exclusion, and native
  Back dismissal passed; modifier submission and hardware stack navigation after dismissal
  remain open.
- Production crash reporting is not integrated; service/project choice is pending.
- A failed first-session write retries while the process lives. If the app dies before
  the cookie reaches durable storage, or the first server response is lost, that anonymous
  identity cannot be recovered from the device. No session expiry was introduced.
- About, Privacy, and Terms open the website. Presentation code remains separate;
  contracts and pure domain rules remain shared.
- Physical push delivery, OS-verified HTTPS links, and store-delivered Capacitor upgrades
  require the release checks in `docs/phone-testing.md`. Simulator previews do not prove them.
- Source upload and builds are now explicitly authorized; store submission is not.
  iOS production build `b4684f7f-ed6f-42a4-8878-a476650daf9d` finished with existing
  credentials. EAS generated an Android key despite `--freeze-credentials`; its build
  `4b1db3e3-9bf4-4fdb-a0d7-2c3383c80751` was canceled without an artifact and the new key
  removed. The recovered archive key matches neither Play's current upload certificate nor
  its app-signing certificate. The registered upload key remains missing locally and in EAS.
  Play manages app signing and offers upload-key reset, but no reset is authorized or started.
  Production Android requires local credentials and cannot generate a replacement.
  See `docs/mobile-release-inputs.md`. No store submission was made.

# Real legacy-to-Expo upgrade verification

Verified September 19, 2026 against the local web app and OrbStack database. Raw receipts
(evidence JSON, screenshots, logs) stayed on the test machine and are not retained.

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

### Fresh-session loss during an immediate update

Three independent fresh-install trials reproduced identity loss in Play code 111 with
Android System WebView `124.0.6367.219`. The old app's first post succeeded, but its new
session cookie had not reached persistent storage before process replacement:

| Trial                                      | Time from first post to interruption | Result                                                                                                                                    |
| ------------------------------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| A: force-stop, then relaunch               | 10.074 seconds                       | Next post had a different author. Only the main cookie database was captured; sidecar state is unknown.                                   |
| B: force-stop, then relaunch               | 14.672 seconds                       | Different author. Main cookie database empty, no WAL/SHM, journal empty.                                                                  |
| Direct: install Expo with `adb install -r` | 12.953 seconds                       | Different author. No explicit force-stop, restart, or persistence wait before the update. Main database empty, no WAL/SHM, journal empty. |

The direct trial preserved the original install time and application data. Its legacy post
`684fbc7c-fc7f-42c0-9efc-932eb36d05db` belonged to
`7ca2b896-483e-4bb7-9529-1d90562977dc`; the Expo post
`26a582ca-eded-4ea7-bdb6-808c96ef3a67` belonged to
`0014ed6b-e7a5-4983-8f6a-5a59b13d70a8`. Expo cannot recover a cookie that existed only in the
old process's memory. These measured intervals do not establish a universal persistence
threshold. The separate persisted-session migration pass remains valid.

Trial B's original capture misclassified missing sidecars because adb returned error text
with exit code zero; the corrected metadata uses actual directory listings. Trial A had a
backend interruption before its second write; B and Direct did not.

### Legacy persistence compatibility fix — immediate-upgrade regression passed

`apps/web/src/lib/persist-legacy-session.ts` now awaits a native persistence barrier after
every oRPC response on Android when the `CapacitorCookies` plugin exists. Reads can renew a
session too. The barrier deletes only reserved, unused key `__ys_persistence_barrier` at
the current origin; it never reads, reissues, or weakens the HttpOnly session cookie.

This depends on verified implementation in the **fixed shipped binaries**, not a general
Capacitor API guarantee. In both original APKs, `deleteCookie` calls the native cookie
setter, that setter calls Android `CookieManager.flush()`, and only then does the plugin
resolve. Reviewed original APK SHA-256:

| Play code | SHA-256                                                            |
| --------- | ------------------------------------------------------------------ |
| 1         | `3d1abe2035b37a1448edac345de9304d731bf0fdce9b057ade9f2db392fdd352` |
| 111       | `8b7fae151ae6b97f5f6e0df8b081de8ea097109afaf789e93f86789551e305ec` |

A bridge rejection is logged without session data and preserves the server response;
turning an already committed write into a retryable RPC failure could duplicate it.

Static verification, source review, and immediate first-post → Expo replacement passed on
both 111 and 1. No added sleeps, explicit pre-update force-stop, or fixture flush calls:

| Play code | Update began after first post | Same author before update, after update, and after native restart |
| --------- | ----------------------------- | ----------------------------------------------------------------- |
| 111       | 10.821 seconds                | `21c91479-f395-4ff5-a4a6-5167f6399aa6`                            |
| 1         | 10.748 seconds                | `8b525a5b-e2c2-411c-a418-d56aefb5fb69`                            |

Both complete cookie snapshots contained a persistent HttpOnly session before replacement;
the reserved sentinel was absent. Install time was preserved, and Expo cleared the legacy
jar after import. Each native restart retained the author for another real UI post.
Release logs exposed no native bridge-call lines, so no separate log-based invocation
claim is made. This is one local API 35 regression per fixed historical APK, not a universal
persistence timing guarantee.

The web fix deployed from main `598876dd` before Expo rollout. CI and Vercel reported
success; the public home page returned HTTP 200 and referenced a chunk containing the
barrier key and its sanitized failure message.

The fix cannot cover code 30 (no Capacitor
bridge), an old page that has not loaded the new JavaScript, a failed native barrier, or
process death before the barrier completes. Physical store updates remain a separate gate.

The historical APKs also exposed unavailable `App` and `SplashScreen` plugin calls from
today's web code. The provider now checks plugin availability and limits the back handler
to Android. Legacy Home, composer, and publish passed after the App guard; the missing-App
rejection disappeared. Both old runtimes loaded and published during the fixed regression
runs with the SplashScreen availability guard.

### Older Play cohorts

Actual codes 1 and 30 were redirected to the local API and signed with the same fixture key
as Expo. DEX and AndroidManifest bytes are unchanged. Code 1 changes only the Capacitor URL;
code 30 changes only its `target_url` resource. Neither cohort needed a manifest override.

Play code **1 passed** all four UI posts with user `15f17295-6d87-4ff4-9374-6864c36fa70b`:

| Phase                | Local post ID                          |
| -------------------- | -------------------------------------- |
| Legacy first post    | `34083921-78ae-41fc-9297-ef4273bcc459` |
| Legacy after restart | `8682fe12-78e6-48ba-8a40-b578e997d4ea` |
| Expo after update    | `879bfa21-8c7c-471f-9623-2c89e370a0b3` |
| Expo after restart   | `8a098410-9c8a-40cc-9a07-7710540020ac` |

The legacy cookie was verified on disk before restart and cleared after import. This test
waited for persistence; it does not cover the fresh-session interruption window.

Play code **30 passed** all four real UI posts with user
`7e4d8713-92e0-4f37-a895-4e7e32ca16d5`:

| Phase                | Local post ID                          |
| -------------------- | -------------------------------------- |
| Legacy first post    | `f34a2591-a91c-4ca2-a546-7bd32dd3a1f0` |
| Legacy after restart | `b654d119-205a-4ddb-83a5-9b591b15af4a` |
| Expo after update    | `1d2c4578-14de-44e9-933d-0cbe9bbe05ae` |
| Expo after restart   | `7b50312d-2ee0-4417-acac-8251d3508e0b` |

The original session was preserved across a Mac-lock interruption. The native writes and
restart completed after unlock; no reset or reinstall was used to resume the cohort.
This establishes persisted-cookie migration for code 30; it does not give that bridgeless
runtime the new Capacitor persistence barrier.

## Keyboard follow-up

Android API 35 passed editor exclusion and Right/Left/Space stack navigation after native
Back dismissed the keyboard and composer, without refocusing or restarting. Ctrl+Enter
opened Android Studio's host New popup; no post was created. That modifier check remains
unverified. No user-wide shortcuts were changed; the temporary draft was cleared.

## Web draft regression

Restoring a saved draft during the first client render mismatched the server's empty
`data-textarea-value`, which drives autosizing. The form now restores it after hydration,
without overwriting a dirty field. Browser UI verification passed: all 12 saved lines
survived desktop reload at 288px (`clientHeight === scrollHeight`) with matching mirror
text and no hydration warning. Publishing cleared the draft after reload. At 390×844,
closing/reopening the mobile drawer restored all 12 lines at 240px with no internal
clipping. The temporary draft was cleared and the viewport override reset.

## Current-source auth recheck

Rechecked September 19 against main `200b33f5` and the latest local Expo fixtures from
`a4febf06`. Auth transport, SecureStore, migration, native cookie readers, API source, app
identity/configuration and dependency lockfile are unchanged from the genuine upgrade
source `12a2e0c0`. The web persistence fix is unchanged from `598876dd`. No auth code fix
was needed in this pass.

- Live, read-only Postgres verification matched all 22 recorded posts to their original
  authors across six runs: iOS, Android 111/1/30 persisted sessions, and Android 111/1
  immediate updates after the persistence fix.
- The preserved iOS legacy-upgrade device received the latest Expo fixture in place.
  Two new UI posts, before and after a cold restart, retained original Capacitor author
  `3243aed8-e6b5-4aa9-a856-a373b40790f6`. Post IDs:
  `17c57942-08a7-4aa2-b0b3-680652ab822f` and `75158576-0333-4075-8c3e-edcbcdcef312`.
- A separate registered iOS account still displayed `ioslike0919@test.local` in Settings
  after a cold restart.
- Android retained `androidlike0919@test.local` before and after the latest Expo
  `install -r`, then through two cold restarts. Original install time remained
  `2026-09-19 09:29:43`. This additional check is Expo-to-Expo; the genuine old-app migration
  evidence is above. No uninstall, data reset, session injection, or adb tap/typing input.
- Fresh checks passed: 36 native migration/storage/race tests, 68 API tests, and 11 auth
  database integration tests, including epoch-less cookies and legacy-password recovery.
  The database tests initially could not connect while OrbStack was stopped; they passed
  after the existing local database was restored. No schema reset or seed was used.

The signed EAS artifacts use the same auth implementation; see
[verified production artifacts](./mobile-release-inputs.md#verified-production-artifacts).
These results establish local auth retention, with the fresh-cookie and physical-delivery
limits already described above.

## Remaining release evidence

These tests establish local session migration. They do not establish physical store
update delivery, production push, verified HTTPS links, or production crash collection.
Those gates remain in [phone testing](./phone-testing.md), the
[release gate](https://github.com/kyh/yours-sincerely/issues/125) and
[crash reporting](https://github.com/kyh/yours-sincerely/issues/126).

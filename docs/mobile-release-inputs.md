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

Notifications are rows in the `Notification` table, written by the API when someone
replies to a letter, and pushed to phones through Expo's push service. No server-side
key: the server posts to `exp.host` unauthenticated and the device credentials live in
EAS.

- `RESEND_API_KEY`: Resend server API key for transactional email. Web/server only.
- `GOOGLE_SERVICES_JSON`: EAS file variable containing the Firebase Android app config for `com.kyh.yourssincerely`.
- iOS: APNs key, created and stored by EAS during `eas credentials` for production.
- Android: FCM V1 service-account key, uploaded to EAS as the production push credential, plus the file above.

Then use physical devices to opt in, receive a notification, and open its exact post.

### Knock cutover

The `Notification` table starts empty. `pnpm -F db knock-backfill:remote` copies Knock's
`new-comment` feed into it (read state included) and is idempotent on (recipient,
comment). It reads the production `POSTGRES_URL` from `.env.production.local` — the file
`pnpm db:push-remote` already uses — and `KNOCK_API_KEY` from that file or the shell.
Never put production values in `.env`: it feeds `pnpm dev`, `db:push --force` and the
non-idempotent seed.

1. `pnpm db:push-remote` — creates `Notification` and `PushToken` on production. Deployed
   without them, the new API rolls back every reply to someone else's letter.
2. `pnpm -F db knock-backfill:remote`.
3. Deploy the build that writes `Notification` and no longer calls Knock.
4. `pnpm -F db knock-backfill:remote` again to catch replies that landed in between.
5. `pnpm -F db knock-backfill:remote --check` — exits non-zero if any recipient has fewer
   rows than Knock; prints every skipped message with its reason (archived, comment or
   letter deleted, malformed payload). Rows the table has beyond Knock are expected: new
   replies never reach Knock.

`--from-posts` is the fallback if Knock is unreachable: one unread row per existing
comment on someone else's letter, never touching a row that exists. Drop `KNOCK_API_KEY`
from `.env.production.local` after the check passes.

## Validate

Put local test values in `.env`, then run:

```sh
pnpm release:mobile:check
```

The check also refuses `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_API_PORT`: they are inlined
into the bundle and would repoint a store build at another API. Keep them out of the
production EAS environment.

The `GOOGLE_SERVICES_JSON` file variable is still unset in the production EAS
environment, so every `eas build --profile production` fails at `eas-build-post-install`
until it is.

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

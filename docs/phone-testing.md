# Phone testing

There are two different phone tests. Run both. A preview build tests the app. Only a store-delivered update tests Capacitor session retention.

## 1. Installable preview

Preview builds use `Yours Sincerely Preview` and separate app IDs. They can live beside the App Store or Play build without replacing it. They use the live API, but cannot prove legacy-cookie migration, verified universal links, store signing, or production push delivery.

From `apps/expo`:

```sh
# First iPhone only: signs into Apple and registers its UDID
pnpm exec eas device:create

# Install from the links EAS returns
pnpm exec eas build --profile preview --platform ios
pnpm exec eas build --profile preview --platform android
```

The iOS build is an ad hoc physical-device build. The Android build is an installable APK. A simulator-only iOS profile remains available as `simulator`.

Preview smoke test:

1. Open feed. Refresh and paginate.
2. Tap Like while signed out. Complete the generated-account flow.
3. Confirm profile, like count, unlike, edit profile, and sign out.
4. Kill and reopen. Confirm the preview session survives.
5. Test light/dark mode, larger text, loading, empty, error, and offline recovery states.
6. Test post and profile sharing through the custom `yourssincerely-preview://` scheme.

## 2. Real Capacitor-to-Expo upgrade

Do not uninstall the existing store app. Uninstall/reinstall deletes the evidence this test needs.

Before building:

```sh
# From repository root
pnpm release:mobile:check

# From apps/expo. Seed each value above the currently shipped store build.
pnpm exec eas build:version:set --platform ios --profile production
pnpm exec eas build:version:set --platform android --profile production
```

Build and send to private store testing:

```sh
pnpm exec eas build --profile production --platform all
pnpm exec eas submit --profile production --platform ios --latest
pnpm exec eas submit --profile production --platform android --latest
```

The iOS submission targets existing App Store Connect app `1510472230` and becomes a TestFlight build. Android submission targets Play Internal Testing. Do not distribute a locally signed APK for the Android migration test: Play-installed apps must receive an update signed by Play.

On each phone:

1. Install the current public Capacitor build from its store.
2. Open a post and tap Like. Finish account creation if prompted.
3. Record the profile name and liked post. Force-quit and reopen once.
4. Without uninstalling, update through TestFlight or Play Internal Testing.
5. Open Expo. It must show the same user without a sign-in prompt.
6. Confirm the recorded like and profile. Unlike/re-like. Force-quit and reopen twice.
7. Background for several minutes, reopen, and confirm the session again.
8. Open post, profile, and password-reset HTTPS links from Notes/Messages with the app cold and warm.
9. Opt into notifications. Receive one push and confirm it opens the exact post.

Failure evidence to capture: platform, old/new build numbers, exact screen, whether the old app was ever uninstalled, and a screen recording from before update through first Expo launch.

## Inputs still needed

These cannot safely be invented or recovered from source code.

### Apple

- Sign into the Apple Developer team in EAS. The linked EAS account currently reports no Apple team.
- Register each physical iPhone UDID for preview builds.
- Give EAS access to the existing App Store Connect app and its distribution credentials.
- Look up the live Capacitor `CFBundleVersion`; seed EAS above it.
- Add the Apple ID used on the phone as an internal/external TestFlight tester.

### Google Play

- Import the existing Play upload keystore. Never generate a replacement for the production package.
- Confirm Play App Signing is active and the committed app-link certificate matches Play Console.
- Look up the live Capacitor `versionCode`; seed EAS above it.
- Add a Play service-account JSON key to EAS Submit, or upload the AAB manually.
- Add the phone's Google account to the Internal Testing tester list.

### Expo push delivery

- Create/select the Firebase Android app for `com.kyh.yourssincerely`.
- Add its downloaded `google-services.json` to EAS production as a file variable named `GOOGLE_SERVICES_JSON`.
- Upload a Firebase service-account key as the production FCM V1 credential through `eas credentials`.
- Let EAS configure the Apple APNs key while setting up production iOS credentials.
- Preview push is optional. It needs a separate Firebase app/file for `com.kyh.yourssincerely.preview`.

### Knock

- Already present: Vercel production `KNOCK_API_KEY`, public key, and feed channel. The public key and feed channel are synced to EAS preview/production.
- Still needed: production `NEXT_PUBLIC_KNOCK_EXPO_CHANNEL_ID`.
- Configure the Knock Expo channel with project `@kaiyuhsu/yours-sincerely` and an Expo access token only if Expo Enhanced Push Security is enabled.
- Optional hardening: add `KNOCK_SIGNING_KEY` to Vercel and enable Knock Enhanced Security.

All configured Knock values must come from the same environment. Explicitly marked test keys are rejected by the release gate.

### Session signer

- Keep the current production `COOKIE_SECRET` unchanged through the migration.
- If it was rotated since the Capacitor release, add the old signer to `COOKIE_SECRET_LEGACY` in the web deployment.

## Done gate

Do not call session continuity complete until both store-delivered upgrades pass on physical phones. Preview, Expo Go, simulator, clean install, and uninstall/reinstall do not count.

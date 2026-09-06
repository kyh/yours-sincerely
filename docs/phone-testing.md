# Phone testing

There are two different phone tests. Run both. A preview build tests the app. Only a store-delivered update tests Capacitor session retention.

## 1. Installable preview

Preview builds use `Yours Sincerely Preview` and separate app IDs. They can live beside the App Store or Play build without replacing it. They use the live API, but cannot prove legacy-cookie migration, verified universal links, store signing, or production push delivery.

`apps/expo/eas.json` requires eas-cli 18.4 or newer; `eas --version` shows what is
installed and `npm i -g eas-cli` updates it. `build.base.pnpm` must equal the root
`packageManager` version: EAS ignores that field, and `corepack: true` without a `pnpm`
pin installs the image's default pnpm and fails on Corepack's shim.

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

## 3. Automated upgrade fixture (simulator + emulator)

Proves the Capacitor→Expo session hand-off without a store build: stage a legacy cookie
where the old app left it, install the Expo build over the same app id, and confirm the
Settings screen shows the staged account. It does not replace the physical-phone gate, but
it catches regressions in `apps/expo/modules/legacy-cookie` and the migration code on
every change. Both legs passed on 2026-09-05 (iOS 18.6 simulator, Pixel 6 API 35 emulator).

Prerequisites: `pnpm db:start && pnpm db:push`, `pnpm dev:web`, and a signed cookie for a
local account — sign up with curl and keep the `Set-Cookie` value:

```sh
curl -s -D - -o /dev/null -X POST http://localhost:3000/api/orpc/auth/signUp \
  -H 'content-type: application/json' \
  -d '{"json":{"email":"legacy@test.local","password":"password123"}}' | grep -i '^set-cookie'
```

Native projects must be regenerated first: `apps/expo/ios` and `apps/expo/android` are
gitignored prebuild output and go stale. From `apps/expo`:

```sh
APP_VARIANT=production pnpm with-env expo prebuild --clean --no-install
(cd ios && pod install)
CI=1 pnpm with-env expo start --dev-client --localhost   # separate terminal
```

### iOS

`expo run:ios` refuses to build a simulator app without a signing certificate because of
the associated-domains entitlement; call xcodebuild directly. `DEVELOPMENT_TEAM` matters:
without it the simulator build has no keychain entitlement and SecureStore throws.

```sh
xcodebuild -workspace ios/YoursSincerely.xcworkspace -scheme YoursSincerely \
  -configuration Debug -sdk iphonesimulator -destination "id=$SIM" \
  -derivedDataPath /tmp/ys-ios DEVELOPMENT_TEAM=N89P364V32 CODE_SIGN_IDENTITY=- build
APP=/tmp/ys-ios/Build/Products/Debug-iphonesimulator/YoursSincerely.app
xcrun simctl install "$SIM" "$APP"
C=$(xcrun simctl get_app_container "$SIM" com.tehkaiyu.yourssincerely data)
mkdir -p "$C/Library/Cookies"
python3 scripts/legacy-session-fixture/write-binarycookies.py \
  "$C/Library/Cookies/Cookies.binarycookies" yourssincerely.org __session "$COOKIE"
xcrun simctl launch "$SIM" com.tehkaiyu.yourssincerely --initialUrl http://localhost:8081
```

Pass: `Cookies.binarycookies` disappears after the first launch (cleanup only runs once the
server accepted the copied session), and after `simctl terminate` + relaunch the Settings
screen (`xcrun simctl openurl "$SIM" yourssincerely://settings`) shows the staged email.

### Android

The legacy shell in `apps/mobile` builds with `./gradlew assembleDebug`; enable WebView
debugging for the run by adding `"android": {"webContentsDebuggingEnabled": true}` to the
generated (gitignored) `android/app/src/main/assets/capacitor.config.json`. Sign both APKs
with the same key — Expo's prebuild ships its own `android/app/debug.keystore`, so re-sign
its APK with `~/.android/debug.keystore` via `apksigner` or the update is refused.

```sh
adb install apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.kyh.yourssincerely/.MainActivity
adb forward tcp:9333 "localabstract:$(adb shell cat /proc/net/unix | grep -o 'webview_devtools_remote_[0-9]*' | head -1)"
node scripts/legacy-session-fixture/seed-webview-cookie.mjs http://localhost:9333/json \
  yourssincerely.org __session "$COOKIE"
sleep 35 && adb shell input keyevent KEYCODE_HOME && sleep 5   # let Chromium flush the jar
adb shell am force-stop com.kyh.yourssincerely
adb install -r <expo apk re-signed with ~/.android/debug.keystore>
adb reverse tcp:8081 tcp:8081 && adb reverse tcp:3000 tcp:3000
adb shell am start -a android.intent.action.VIEW \
  -d "yourssincerely://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"
```

Pass: the WebView jar (`app_webview/Default/Cookies`, readable on a rooted emulator) has no
`__session` row after the first launch, and `adb shell am start -d yourssincerely://settings`
shows the staged email before and after `am force-stop` + relaunch.

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

Nothing else: the server sends through Expo's push service without a token, and the
in-app feed is the `Notification` table.

### Session signer

- Keep the current production `COOKIE_SECRET` unchanged through the migration.
- If it was rotated since the Capacitor release, add the old signer to `COOKIE_SECRET_LEGACY` in the web deployment.

## Done gate

Do not call session continuity complete until both store-delivered upgrades pass on physical phones. Preview, Expo Go, simulator, clean install, and uninstall/reinstall do not count.

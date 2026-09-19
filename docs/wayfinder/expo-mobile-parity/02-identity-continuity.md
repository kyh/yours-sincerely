# 02 Identity continuity

- [x] Copy legacy Capacitor cookie (iOS + Android, fixture-verified).
- [x] Verify server auth before cleanup.
- [x] Preserve session across force restart.
- [x] Refresh workspace after anonymous like or flag.
- [x] Upgrade current anonymous user during sign-up.
- [x] Fresh install: like, profile appears, restart, sign up, same user ID.
- [x] Sign-out or account deletion before cleanup cannot be resurrected from the legacy jar.
- [x] Native cookie jar never shadows SecureStore (`credentials: "omit"`).

September 19 local UI runs passed on fresh iOS 26.5 and Android API 35 fixtures.
Each first Like created an anonymous profile; a second Like after restart used the same
user. Native sign-up upgraded that user, and another restart retained both Likes and the
Settings email. iOS user `45c62f87-52a3-4863-86eb-eabb4585c1d1`; Android user
`7f0d0535-169f-4bab-bb31-3ac35f1a9ba1`. Database receipts and UI evidence:
`/tmp/ys-ios-like-theme-20260919/` and `/tmp/ys-android-like-theme-20260919/`.
These use local APIs and fixture signing, not store distribution.

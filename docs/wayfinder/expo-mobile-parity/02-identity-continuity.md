# 02 Identity continuity

- [x] Copy legacy Capacitor cookie (iOS + Android, fixture-verified).
- [x] Verify server auth before cleanup.
- [x] Preserve session across force restart.
- [x] Refresh workspace after anonymous like or flag.
- [x] Upgrade current anonymous user during sign-up.
- [ ] Fresh install: like, profile appears, restart, sign up, same user ID.
- [x] Sign-out or account deletion before cleanup cannot be resurrected from the legacy jar.
- [x] Native cookie jar never shadows SecureStore (`credentials: "omit"`).

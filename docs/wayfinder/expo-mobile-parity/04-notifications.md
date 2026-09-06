# 04 Notifications

- [x] In-house `Notification` table + `notification` / `push` routers; no third-party feed.
- [x] Register the Expo push token at app root; unregister on sign-out with the cleanup capability.
- [ ] Backfill the table from Knock before and after the cutover deploy (`pnpm -F db knock-backfill`).
- [x] Explicit, contextual permission UX.
- [ ] Receive push and open exact post.

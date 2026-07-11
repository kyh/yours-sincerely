# Expo mobile parity

## Destination

Ship Expo as the Capacitor app update. Preserve identity. Match web features. Improve native quality without sharing presentation code.

## Stop rule

Signed Release passes the upgrade journey and critical native journeys on iOS. API authorization and public contracts have regression coverage. No known launch blocker remains.

## Map

| Slice                                                 | Status      | Proof                                            |
| ----------------------------------------------------- | ----------- | ------------------------------------------------ |
| [01 API safety](./01-api-safety.md)                   | Verified    | Four schema tests + three database tests         |
| [02 identity continuity](./02-identity-continuity.md) | Verified    | Real Capacitor cookie, reinstall, cold restart   |
| [03 profile Release](./03-profile-release.md)         | Verified    | Signed Hermes Release + live profile persistence |
| [04 notifications](./04-notifications.md)             | In progress | Explicit opt-in + routing; physical push pending |
| [05 deep links](./05-deep-links.md)                   | Implemented | Universal links + canonical HTTPS password reset |
| [06 shared domain](./06-shared-domain.md)             | Implemented | Contracts, calendar, content, preferences shared |
| [07 release gate](./07-release-gate.md)               | In progress | iOS E2E + Android Release launch passed          |
| [08 polish](./08-polish.md)                           | Implemented | Native UX, offline state, reduced motion, Sentry |

## Decisions

- Keep web and native UI separate.
- Share contracts and pure domain rules.
- Upgrade anonymous identity during sign-up.
- External legal pages remain acceptable.
- Preserve existing avatar mapping; changing modulus would reshuffle users.

## Fog

- Production values listed in [mobile release inputs](../../mobile-release-inputs.md).
- Android legacy-session upgrade fixture.

## Out of scope

- Visual rewrite disconnected from current brand.
- Shared React components across DOM and native.
- Database schema rewrite.

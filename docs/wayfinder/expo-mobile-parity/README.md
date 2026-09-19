# Expo mobile parity

## Destination

Ship Expo as the Capacitor app update. Preserve identity. Match web features. Improve native quality without sharing presentation code.

## Stop rule

Store-delivered updates preserve the existing identity on physical iOS and Android phones.
The current candidate passes critical native journeys, push delivery and verified HTTPS links
on both platforms. API authorization and public contracts have regression coverage.

## Map

| Slice                                                 | Status      | Proof                                                            |
| ----------------------------------------------------- | ----------- | ---------------------------------------------------------------- |
| [01 API safety](./01-api-safety.md)                   | Verified    | Four schema tests + three database tests                         |
| [02 identity continuity](./02-identity-continuity.md) | In progress | All listed Android cohorts pass locally; physical checks pending |
| [03 profile Release](./03-profile-release.md)         | In progress | Own profile passed; read-only profile and theme checks remain    |
| [04 notifications](./04-notifications.md)             | In progress | Feed history carried over; physical push delivery pending        |
| [05 deep links](./05-deep-links.md)                   | Implemented | Universal links + canonical HTTPS password reset                 |
| [06 shared domain](./06-shared-domain.md)             | Implemented | Contracts, calendar, content, preferences shared                 |
| [07 release gate](./07-release-gate.md)               | In progress | Updated UI builds and physical checks pending; regression passed |
| [08 polish](./08-polish.md)                           | In progress | Keyboard runtime and production crash reporting pending          |
| [09 parity review](./09-parity-review.md)             | In progress | Source fixes verified; final native keyboard/UI pass pending     |

## Decisions

- Keep web and native UI separate.
- Share contracts and pure domain rules.
- Upgrade anonymous identity during sign-up.
- External legal pages remain acceptable.
- Preserve existing avatar mapping; changing modulus would reshuffle users.

## Fog

- Production values listed in [mobile release inputs](../../mobile-release-inputs.md).

## Out of scope

- Visual rewrite disconnected from current brand.
- Shared React components across DOM and native.
- Database schema rewrite.

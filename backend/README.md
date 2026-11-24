# Camel Finance — Backend API

Node/TypeScript + Express + Prisma API for the Camel Finance app: a personal
finance app for the Lebanese market with Wish Money / OMT / card top-ups,
tiered fees, gamification, premium (human-advisor) calendar bookings, savings
goals, and optional life/savings-plan insurance policies.

## Quick start

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

The API listens on `http://localhost:4000` by default. A demo account is
seeded: `demo@camelfinance.app` / `password123`.

**Phase 1 by default:** `FEATURE_WALLET_ENABLED=false`, so `/payments/deposit`
and `/payments/withdraw` return 403, goal contributions are self-reported
(no wallet debit), insurance has no `pay-premium` (use `request-referral`
instead), and coaching-session fees are charged directly to a card, not a
wallet. See `../docs/PHASED-LAUNCH.md` for why and how Phase 2 turns it on.

## Module map

| Module | Responsibility |
|---|---|
| `modules/auth` | Signup/login (JWT), KYC gate |
| `modules/wallet` | Balance + transaction history (mirrors the partner ledger — see `modules/ledger`) |
| `modules/ledger` | `PartnerLedgerAdapter` — Phase 2 licensed banking/e-wallet partner integration point |
| `modules/payments` | Deposit/withdraw via pluggable adapters (Card/Wish Money/OMT), payment methods — gated by `FEATURES.walletEnabled` |
| `modules/fees` | Single source of truth for the fee schedule (`fee.service.ts`) |
| `modules/gamification` | Points, levels, streaks, badges |
| `modules/goals` | Savings goals, progress logging/contributions, goal projections |
| `modules/insurance` | Life/savings-plan policies, linking a policy to a goal, insurer referrals |
| `modules/bookings` | Money coaches, calendar slots, paid coaching sessions |
| `modules/dashboard` | One aggregated read for the mobile app's home screen |

## Payment adapters

`modules/payments/adapters/*` implement a shared `PaymentAdapter` interface
(`charge` / `payout`). `CardAdapter`, `WishMoneyAdapter` and `OmtAdapter` are
**mock implementations** — Wish Money and OMT don't expose public developer
APIs, so a production integration requires a direct commercial/technical
agreement with each network (see `../docs/COMPLIANCE.md`). Swapping a mock
for the real thing means writing one new class against the same interface;
nothing else in the codebase needs to change.

## Fee schedule

See `modules/fees/fee.service.ts`. Fees scale with `InteractionLevel`:
`BASIC` (self-serve) < `STANDARD` (higher-value/cross-border) <
`PREMIUM_HUMAN` (a booked session with a live advisor) — this is the "make
more money the more human interaction is involved" model from the product
brief.

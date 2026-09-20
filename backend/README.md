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

## Module map

| Module | Responsibility |
|---|---|
| `modules/auth` | Signup/login (JWT), KYC gate |
| `modules/wallet` | Balance + transaction history |
| `modules/payments` | Deposit/withdraw via pluggable adapters (Card/Wish Money/OMT), payment methods |
| `modules/fees` | Single source of truth for the fee schedule (`fee.service.ts`) |
| `modules/gamification` | Points, levels, streaks, badges |
| `modules/goals` | Savings goals, contributions, goal projections |
| `modules/insurance` | Life/savings-plan policies, linking a policy to a goal, premium billing |
| `modules/bookings` | Advisors, calendar slots, premium human-advisor sessions |
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

# Camel Finance — Architecture

A personal finance app for the Lebanese market: wallet + payments (Wish
Money / OMT / card), tiered fees, gamification, premium human-advisor
booking, savings goals, and an optional life/savings-plan insurance
integration. This document maps the product brief to what's actually built
in `../backend` and `../app`, and what's stubbed vs. real.

## System overview

```
┌─────────────────────┐        HTTPS/JSON        ┌──────────────────────────┐
│  Mobile app (Expo)   │ ───────────────────────► │  Backend API (Express)  │
│  iOS + Android       │ ◄─────────────────────── │  Node + TypeScript      │
└─────────────────────┘                           └──────────┬───────────────┘
                                                               │ Prisma ORM
                                                               ▼
                                                    ┌──────────────────────┐
                                                    │ PostgreSQL (SQLite   │
                                                    │ in local dev)        │
                                                    └──────────────────────┘
                                                               │
                          ┌────────────────────────────────────┼────────────────────────┐
                          ▼                                    ▼                         ▼
                 PaymentAdapter interface            Advisor calendar/booking   Insurance policy
                 (Card / Wish Money / OMT)            (premium human sessions)   records (life/savings)
```

## Why this stack

- **React Native (Expo)** — one TypeScript codebase ships to iOS and
  Android, which the brief asks for explicitly ("deployed to iOS and
  Android"). Expo also gives a fast path to TestFlight/Play internal
  testing without hand-rolling native build pipelines.
- **Node/TypeScript + Express + Prisma** — the same language across
  frontend and backend, a mature ecosystem for payments/webhooks, and
  Prisma gives a typed, migratable schema. SQLite is used for zero-config
  local dev; the schema is written to be portable to PostgreSQL (the
  recommended production datasource) by changing two lines in
  `backend/prisma/schema.prisma`.

## Feature → implementation map

| Brief requirement | Where it lives |
|---|---|
| Plug into Wish Money and OMT | `backend/src/modules/payments/adapters/{wishmoney,omt}.adapter.ts` behind a shared `PaymentAdapter` interface |
| Card / debit / credit gateway | `backend/src/modules/payments/adapters/card.adapter.ts` |
| Fee that scales with "level of interaction" | `backend/src/modules/fees/fee.service.ts` — `BASIC` < `STANDARD` < `PREMIUM_HUMAN` fee tiers |
| Premium = human intervention, calendar booking | `backend/src/modules/bookings/*`, app screen `PremiumBookingScreen.tsx` |
| Payment gateway (card) | `CardAdapter`, `AddMoneyScreen.tsx` |
| Gamified dashboard | `backend/src/modules/gamification/*` (points, levels, streaks, badges) + `DashboardScreen.tsx`, `LevelProgress.tsx`, `BadgeRow.tsx` |
| Life & savings-plan insurance, addable later, linked to goals | `backend/src/modules/insurance/*`, `backend/src/modules/goals/*` (`projectGoal` folds a linked policy's coverage into the goal projection) |

## The fee model (how the app makes money)

`fee.service.ts` is the single source of truth. Interactions are classified
into three tiers, and price scales with how much of the platform's (and
eventually a human's) attention they consume:

- **BASIC** — self-serve deposit/withdrawal below the standard threshold.
  Card: 2.9% + $0.30 (typical processor economics). Wish Money/OMT cash-in:
  1.5%, minimum $1.
- **STANDARD** — larger or cross-border-flavored transfers (≥ $500):
  1% + $1.50 surcharge, reflecting more manual review/compliance overhead.
- **PREMIUM_HUMAN** — a booked session with a live advisor: a flat fee per
  session length ($10/$15/$25 for 15/30/60 minutes), charged when the user
  confirms the booking.

This directly implements "a small fee... depending on the level of
interaction... premium involves human intervention."

## Payment adapters are mocked — on purpose

Wish Money and OMT do not publish self-serve developer APIs. A real
integration requires a direct commercial and technical agreement with each
network (they typically settle via bank/PSP rails or file-based
reconciliation, and cash-in/out often happens at a physical branch/agent
rather than synchronously). Similarly, taking real card payments requires a
PCI-DSS-compliant processor relationship (Stripe, or a local acquirer like
Areeba/NCB's gateway) — raw card data should never touch this backend
directly; use the processor's client-side tokenization SDK from the mobile
app instead.

Every adapter implements the same `PaymentAdapter` interface
(`charge`/`payout`). The mocks in `backend/src/modules/payments/adapters/`
model the request/response shape those real integrations will need, so the
rest of the app (fee engine, wallet ledger, gamification, goals) can be
built and tested today. Swapping in a real integration is one new class,
not a rewrite.

## Data model

See `backend/prisma/schema.prisma`. Key relationships:

- `User` 1—1 `Wallet` 1—N `Transaction`
- `Transaction` optionally references a `Goal` (contribution) or a
  `Booking` (premium session fee) — one ledger, multiple purposes
- `Goal` 1—0..1 `InsurancePolicy` (a goal can have at most one linked
  policy; a policy can be proposed standalone and linked later — "added at
  a later time" from the brief)
- `Badge`/`UserBadge`/`PointsEntry` back the gamification layer

SQLite has no native enum type, so schema "enums" are plain `String`
columns constrained by TypeScript unions in `backend/src/types/enums.ts`
and validated at the HTTP boundary with `zod`. Moving to PostgreSQL later
can reinstate real `enum` blocks with no application-code changes, since
the value sets already match.

## What a production build still needs

This is a functioning MVP scaffold, not a licensed financial product. See
`COMPLIANCE.md` for the regulatory path in Lebanon. On the engineering
side, before real money moves:

- Replace mock adapters with real Wish Money/OMT/processor integrations,
  including webhook-based async confirmation (cash networks are unlikely
  to confirm synchronously).
- Move the datasource to PostgreSQL with backups/PITR; wrap
  balance-changing operations in DB transactions (the current
  `adjustWalletBalance` + `transaction.create` pair should become one
  atomic Prisma `$transaction`).
- Add idempotency keys on deposit/withdraw endpoints (mobile clients retry).
  Add rate limiting and audit logging on money-movement endpoints.
- Real KYC/AML (Sumsub/Onfido-style document + liveness check, sanctions
  screening) instead of the current self-attestation stub.
- Move the JWT to short-lived access + refresh tokens, and store the token
  in `expo-secure-store` instead of `AsyncStorage`.
- Underwrite insurance through a licensed carrier partnership — this app
  only models the policy record and premium billing, not underwriting.

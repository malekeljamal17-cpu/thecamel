# Phased launch: ship without a Lebanese license, add it later

This is the business decision behind `FEATURES.walletEnabled` in both
`backend/src/config/features.ts` and `app/src/config/features.ts`. See
`docs/COMPLIANCE.md` for the regulatory background this is responding to —
short version: holding customer funds in Lebanon requires a BDL license
that is currently expensive (LBP 50 billion / ~$560K for most Electronic
Payment Service Provider categories, LBP 25 billion / ~$280K for the
lighter "payment facilitator" category) **and**, as of this writing, BDL
has paused new e-wallet/e-money license applications entirely
("until further notice," per Intermediate Circular 735, May 2025).

So Phase 1 is built to never need that license in the first place.

## Phase 1 (now): no wallet, no license needed

| Feature | How it avoids licensing |
|---|---|
| Goals + gamification | `contributeToGoal` is a **self-reported progress log** — the user tells the app they saved money elsewhere. No funds move through Camel Finance, so there's nothing to custody. |
| Insurance | `requestReferral` replaces the old `payPremium`. Camel Finance hands a lead to the named insurer; the insurer underwrites, prices, and bills the customer directly. We never touch premium money, so we're not acting as an insurance intermediary. |
| Money Coach sessions | The booking fee is charged as a **one-off card payment** via `CardAdapter`, not debited from a wallet balance. Accepting a card payment as an ordinary merchant doesn't require an e-money license — only *holding a balance* does. Coach bios/titles are deliberately framed as budgeting coaching, not investment or insurance advice, to stay clear of those separate licensing regimes too. |
| Wallet / Add Money / Withdraw | Hidden in the app, and return `403` from the API (`FEATURES.walletEnabled === false`). This is the one part of the original build that *would* need a license, so it's switched off rather than removed — see below. |

## Phase 2 (later): flip one flag, once there's a licensed partner

Per the earlier conversation's recommendation, the cheapest way into a real
wallet isn't to seek a standalone BDL license — it's to partner with a
bank or one of the ~15 institutions already licensed to issue e-wallets,
and operate as the UX layer on top of their ledger (a "powered by" / BaaS
arrangement). That's exactly what the code is already shaped for:

- `backend/src/modules/ledger/partner.adapter.ts` defines
  `PartnerLedgerAdapter` — `getBalance`/`credit`/`debit` against an
  account at **the partner**, not us. `MockPartnerLedgerAdapter` stands in
  for that partner today, using our own `Wallet` table so the rest of the
  app can be built and tested against the real shape. Swapping in the
  actual partner's API is one new class.
- `Wallet.partnerAccountRef` is where that partner's account identifier
  will live once onboarding happens.
- Every wallet-touching code path (`payments.service.ts`,
  `goals.service.ts#contributeToGoal`, `insurance.service.ts#payPremium`,
  `bookings.service.ts#confirmBooking`) already branches on
  `FEATURES.walletEnabled` and has its Phase 2 logic written and
  typechecked — it's just unreachable until the flag flips. Turning Phase
  2 on is a partner integration, not a rewrite.

To flip it: set `FEATURE_WALLET_ENABLED=true` in the backend's `.env` and
`walletEnabled: true` in `app/src/config/features.ts`, then replace
`MockPartnerLedgerAdapter` with a real implementation calling the
partner's actual ledger API.

**One more prerequisite before that flip, found during the privacy audit
(`docs/PRIVACY-AUDIT.md`):** once there's a real licensed banking
relationship, `auth.service.ts#deleteAccount` can no longer do a full,
immediate erasure for wallet data. Law 44/2015 (AML), via BDL circulars,
requires a regulated financial institution to keep customer account and
transaction records for five years after the account closes. Phase 2
needs `deleteAccount` to branch: anonymize the user's profile immediately
(name/email/phone, free-text goal names and booking topics), but retain
`Wallet`/`Transaction` rows for that five-year window before a purge job
deletes them for good. Not built yet — tracked here so it isn't
discovered for the first time after the wallet is already live.


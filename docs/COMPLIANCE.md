# Regulatory context — Lebanon

This is engineering-informed orientation, not legal advice. Get a Lebanese
fintech/payments lawyer and a compliance officer involved before handling
real customer funds — the notes below exist so the product and engineering
plan account for the right shape of requirements early, not to substitute
for that review.

## Who regulates this

- **Banque du Liban (BDL)** regulates banks, financial institutions, and
  electronic payment/money transfer activity in Lebanon. Operating a wallet
  that holds customer balances and moves money is very likely to require a
  BDL license or operating under a licensed partner (e.g. issuing the
  wallet through a licensed bank or e-money institution rather than
  standalone).
- **Wish Money and OMT** are themselves BDL-licensed money transfer
  operators. Integrating with them means becoming their commercial/technical
  partner (an "agent" or API consumer under their compliance umbrella), not
  just calling an open API — neither currently publishes one. Expect a
  due-diligence and contracting process similar to opening a business
  banking relationship.
- **Insurance Control Commission (ICC)** regulates life and savings-plan
  insurance in Lebanon. This app should never underwrite or price insurance
  itself — it should originate/service policies on behalf of an
  ICC-licensed insurance carrier, which does the actual underwriting,
  reserving, and regulatory filing. That's why `InsurancePolicy.provider`
  in the schema is a partner name, not "us."

## AML/CFT and KYC

Any regulated money-movement service in Lebanon needs a KYC program:
identity verification, sanctions/PEP screening, and ongoing transaction
monitoring for suspicious activity, typically reported to BDL's special
investigation unit. The current `submitKyc` endpoint is a manual
self-attestation stub standing in for a real flow — production needs:

- Government ID capture + liveness check (a vendor like Sumsub, Onfido, or
  a regional equivalent with Lebanese ID support)
- Sanctions/PEP list screening
- Ongoing monitoring rules (velocity limits, unusual pattern flags) wired
  to the transaction ledger already in place (`Transaction` table)
- A tiered KYC model: lighter checks for small wallet balances/BASIC
  interactions, fuller KYC required before STANDARD/PREMIUM_HUMAN limits
  unlock — the `InteractionLevel` concept already in `fee.service.ts` is a
  natural hook for this.

## Card payments — PCI-DSS

Raw card numbers/CVV must never reach this backend. Use a PCI-DSS Level 1
processor's client-side SDK (Stripe Elements/PaymentSheet, or a local
acquirer's equivalent) to tokenize the card on-device; the backend only
ever sees a token/charge result, matching the `payerDetails: Record<string,
string>` shape already used in `CardAdapter`.

## Multi-currency reality (USD/LBP)

Lebanese personal finance apps have to deal with USD, "fresh dollars,"
and LBP at materially different effective exchange rates depending on the
channel. This scaffold stores an explicit `currency` on the wallet and each
transaction, but does not implement FX conversion or multi-balance wallets.
Before launch, decide explicitly whether the app is USD-only (simpler,
matches how most Lebanese fintech targets dollarized savings) or needs a
real multi-currency ledger with a defined exchange-rate source — retrofitting
FX into a single-currency ledger is a rewrite, not a patch.

## Data protection

Wallet balances, transaction history, national ID data from KYC, and
insurance policy details are all sensitive. Encrypt at rest, restrict
production database access, and have a data retention/deletion policy —
Lebanon does not yet have a GDPR-equivalent statute in force, but treating
this data at GDPR-level rigor is the safer default given cross-border users
and eventual insurance-partner data sharing.

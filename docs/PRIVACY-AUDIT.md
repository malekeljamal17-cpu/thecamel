# Privacy audit — Camel Finance vs. Lebanon's Law No. 81/2018

This audits the actual data the app collects and stores (as of this
branch) against Lebanon's Law No. 81 of 2018 on Electronic Transactions
and Personal Data (Title 5, "Protection of Personal Data"). As with
`COMPLIANCE.md`, this is engineering-informed orientation, not legal
advice — Law 81's implementing regulations are reported as not yet
issued and Lebanon has no standalone data protection authority, both of
which a Lebanese lawyer should confirm are still current before relying
on any of this.

## What the law actually requires (verified against secondary legal sources)

- **No real consent regime.** The law doesn't define consent or set
  conditions for relying on it. Article 92 limits a data subject's
  ability to object to consent-based processing — commentators flag this
  as *weaker* than most data protection laws, not stronger.
- **Declaration duty (Arts. 94–95).** A controller must declare certain
  processing to the Ministry of Economy and Trade — unless the data
  subject consented, which exempts the controller from declaring.
- **Data subject rights that do exist:** access (Art. 99), rectification
  and erasure (Art. 101), enforced through the courts (Art. 102) — there
  is no regulator to complain to instead.
- **Sensitive data** (health, genetic identity, sex life — Arts. 91/97)
  gets extra restrictions. The law has no general "special category"
  concept beyond that.
- **No breach notification obligation** in the law itself.
- Financial-sector processing is additionally overseen by BDL rather than
  a data protection authority — this audit doesn't cover BDL's own data
  rules; see `COMPLIANCE.md` for the money-movement/licensing side.

## What Camel Finance currently collects

From `backend/prisma/schema.prisma`:

| Data | Where | Notes |
|---|---|---|
| Email, phone, full name, password hash | `User` | Phone is optional |
| KYC status | `User.kycStatus` | Currently a self-attestation stub (`submitKyc` just flips a flag) — no ID document, no liveness check, yet |
| Wallet balance, transaction history | `Wallet`, `Transaction` | Financial data; amounts, provider, fee breakdown, free-text `metadata` |
| Savings goals (name, target/current amount, target date) | `Goal` | Free-text goal `name` — a user could type anything into it |
| Insurance policy details (provider, coverage, premium) | `InsurancePolicy` | No health/medical data collected today — see below |
| Coaching booking `topic` | `Booking` | **Free text** — a user could write anything about their financial (or other) situation here |
| Points, level, streak, badges | `User`, `PointsEntry`, `UserBadge` | Behavioral/engagement data |

**Nothing here is currently classified as Article 91/97 "sensitive" data**
(no health, genetic, or sex-life data) — but see the gap below on
insurance referrals, which is the one place that could change.

## Gaps against Law 81/2018

1. **No declaration filed, and no consent captured either.** The
   exemption in Art. 94 only applies if the data subject consented —
   right now the app captures *no* consent at all (no checkbox, no
   acknowledgment at signup). So Camel Finance is currently in the worst
   position under the law: no consent to claim the exemption, and no
   declaration filed with the Ministry either. **This is the single
   highest-priority fix.**
2. **No way for a user to exercise Art. 99/101 rights in-app.** There is
   no "export my data," "see what you have on me," "correct my
   information," or "delete my account" anywhere in the product —
   confirmed by reading `app/src/screens/ProfileScreen.tsx` (KYC status,
   tier, phone, log out — nothing else) and the backend routes (no
   `GET /auth/me/export`, no `DELETE /auth/me`, no `PATCH` to correct
   profile fields). A user's only recourse today would be the courts
   (Art. 102), which is a bad look even where it's technically legal.
3. **No privacy policy anywhere in the app.** Unlike the separate
   "Camel Family Office" landing page (which has `privacy.html`), Camel
   Finance has no privacy policy screen, link, or document a user can
   read before signing up.
4. **Free-text fields are an unmanaged sensitive-data risk.** `Booking.topic`
   and `Goal.name` are open text. A user writing something like "my HIV
   meds cost too much this month" or "saving for my divorce lawyer" turns
   that row into Art. 91/97 sensitive data (health, in the first example)
   without the app ever deciding to collect it. There's no field-level
   handling that treats these differently from an ordinary string.
5. **Insurance referral is the one feature that could cross into
   sensitive data for real.** `insurance.service.ts#requestReferral` is
   designed to hand the user off to the insurer without Camel Finance
   touching premium money (see `PHASED-LAUNCH.md`) — but nothing stops a
   future version of the referral form from asking health questions
   itself. As built today it only collects coverage/premium amounts, not
   health data, which is the right line to hold.
6. **No stated retention policy**, in the app or in `COMPLIANCE.md` — data
   (transaction history, booking topics, goal names) is kept indefinitely
   with no TTL or deletion job.
7. **No cross-border transfer disclosure** — moot while this runs on local
   SQLite, but becomes a real gap the moment it's deployed to any managed
   Postgres host, most of which aren't in Lebanon.

## "Understand the privacy settings" — current state

There are none. Searching both `backend/src` and `app/src` for
privacy/consent/export/delete/marketing-related code returns nothing.
`ProfileScreen` is the only place a user manages their own account, and
it only shows KYC status, tier, and a log-out button.

## Recommended priority order

1. Add a consent checkbox at signup (even a simple "I agree to the
   Privacy Policy" tied to a `User.privacyConsentAt` timestamp) — this is
   cheap and immediately improves the Art. 94/95 position.
2. Write an actual privacy policy (what's collected, why, who it's shared
   with — e.g. the named insurer on a referral, the card processor) and
   link it from signup and Profile.
3. Add `DELETE /auth/me` (account + data deletion) and a simple
   `GET /auth/me/export` (dump the user's own rows as JSON) — directly
   answers Art. 99/101.
4. Decide a retention period for `Transaction`/`Booking`/`Goal` rows and
   document it, even if "indefinitely, until account deletion" is the
   answer.
5. When real hosting is chosen, name the host/country in the privacy
   policy, the way the landing page's `privacy.html` already does for its
   own stack.

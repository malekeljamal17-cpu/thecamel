# Launching Camel Finance

This is for running the app yourself — on a simulator, emulator, or your
own phone via Expo Go — to test or demo it. Verified end-to-end from a
clean `node_modules` as of this writing.

Publishing to the App Store / Google Play is a separate, later step (see
the bottom of this file) and isn't required for any of this.

## 1. Start the backend

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Leave this running — the API listens on `http://localhost:4000`.

Before this touches anything beyond your own machine, generate a real
`JWT_SECRET` (`openssl rand -base64 48`) and put it in `.env` — the
placeholder shipped in `.env.example` is only long enough to let the
server boot locally.

## 2. Start the mobile app (new terminal)

```bash
cd app
npm install
npm start
```

Then:
- `i` — open in the iOS simulator (macOS only)
- `a` — open in an Android emulator
- scan the QR code with the **Expo Go** app on your phone

**On a physical phone**, `localhost` points at the phone, not your laptop.
Set `apiBaseUrl` in `app/app.json` to your machine's LAN IP first (e.g.
`http://192.168.1.20:4000`), find it with `ipconfig getifaddr en0` (macOS)
or `ipconfig` (Windows).

## 3. Sign in

- Email: `demo@camelfinance.app`
- Password: `password123`

The demo account comes pre-seeded with a wallet balance, two goals, and
gamification progress so the app isn't empty on first open.

## What you'll see

The app currently runs in **Phase 1** (`FEATURES.walletEnabled = false` —
see `docs/PHASED-LAUNCH.md`): goals, gamification, Money Coach bookings
(charged directly to a card), and insurance referrals all work; wallet
top-ups/withdrawals are disabled with a "launching soon" message, by
design, until a licensed banking partner is integrated.

## Beyond local testing: an actual app-store launch

Everything above gets you a working app on your own device. Shipping it
publicly needs, additionally:

- An Apple Developer account and a Google Play Console account
- An EAS (`eas build` / `eas submit`) pipeline instead of `npm start`
- The backend deployed somewhere persistent (managed PostgreSQL instead
  of SQLite; a host like Render/Railway/Fly.io instead of your laptop)
- `FEATURE_WALLET_ENABLED` kept `false` in that deployment until a real
  licensed partner is integrated (`docs/PHASED-LAUNCH.md`,
  `docs/COMPLIANCE.md`)

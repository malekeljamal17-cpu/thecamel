# Camel Finance — Mobile App

React Native (Expo) app for iOS and Android. Talks to the `../backend` API.

## Quick start

```bash
npm install
# point the app at your backend (defaults to http://localhost:4000)
# edit apiBaseUrl in app.json, or set it via EXPO_PUBLIC_* / eas.json per environment
npm start
```

Then press `i` for the iOS simulator, `a` for an Android emulator, or scan the
QR code with Expo Go on a physical device. On a physical device, `localhost`
won't reach your dev machine — set `apiBaseUrl` in `app.json` to your
machine's LAN IP (e.g. `http://192.168.1.20:4000`).

## Screens

- **Login / Signup** — email+password auth against the backend
- **Dashboard** — balance, gamification (level/points/streak/badges), goal previews, premium-session banner, insurance CTA
- **Wallet** — balance + transaction history, entry point to Add Money
- **Add Money** — pick Wish Money / OMT / Card, see the fee, deposit
- **Goals** — create/list savings goals
- **Goal Detail** — contribute funds, link an insurance policy, see a goal projection
- **Insurance** — propose a life/savings-plan policy, pay premiums, link to a goal
- **Premium (Advisor)** — pick an advisor, a calendar date and a time slot, request + confirm a paid human-advisor session
- **Profile** — KYC status/verification, membership tier, log out

## Notes

- Money amounts are always transferred as integer cents to/from the API to
  avoid floating-point rounding bugs; the UI only formats to/from dollars at
  the input/display boundary (`src/utils/money.ts`).
- Auth token is stored in `AsyncStorage` (fine for this MVP). A production
  build should move to a secure keystore (`expo-secure-store`) and add
  biometric unlock, given this is a finance app.

/**
 * Mirrors backend/src/config/features.ts: Phase 1 ships with no wallet, so
 * the app shows a "launching soon" state for anything that would move or
 * hold money, and leads with what doesn't need a license yet — goals,
 * gamification, coaching, and insurance referrals. See
 * docs/PHASED-LAUNCH.md in the repo root.
 *
 * Flip this once the backend's FEATURE_WALLET_ENABLED is on for real.
 */
export const FEATURES = {
  walletEnabled: false,
};

/**
 * Phase 1 of Camel Finance launches without holding customer funds —
 * deliberately, to avoid needing a BDL e-money/EPSP license (currently
 * expensive and, as of this writing, not even accepting new applications).
 * See docs/PHASED-LAUNCH.md for the full reasoning.
 *
 * Flip this on once a licensed banking/e-wallet partner is actually
 * integrated behind modules/ledger/partner.adapter.ts — every wallet
 * code path already checks this flag, so enabling it is a partner
 * integration, not a rewrite.
 */
export const FEATURES = {
  walletEnabled: process.env.FEATURE_WALLET_ENABLED === "true",
};

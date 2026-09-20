import type { InteractionLevel, PaymentProvider, TransactionType } from "../../types/enums";

/**
 * Central fee schedule. This is the one place that decides how much the
 * platform makes on an interaction — kept isolated so pricing can change
 * without touching payment/booking logic. All amounts are in cents (minor
 * currency units) to avoid floating point drift.
 */

export interface FeeQuote {
  feeCents: number;
  breakdown: string;
}

const CARD_PERCENT = 0.029; // 2.9%
const CARD_FLAT_CENTS = 30;

const CASH_IN_PERCENT = 0.015; // Wish Money / OMT cash-in, 1.5%
const CASH_IN_MIN_CENTS = 100; // $1 floor so tiny top-ups aren't free to process

const STANDARD_SURCHARGE_PERCENT = 0.01;
const STANDARD_SURCHARGE_FLAT_CENTS = 150;
const STANDARD_THRESHOLD_CENTS = 50_000; // $500+ counts as a "standard" (higher-touch) transfer

const INTERNAL_TRANSFER_FLAT_CENTS = 25;

// Premium, human-advisor sessions are priced per duration bracket rather than
// as a percentage of any single transaction.
const PREMIUM_SESSION_FEES_CENTS: Record<number, number> = {
  15: 1000, // $10
  30: 1500, // $15
  60: 2500, // $25
};

export function classifyInteractionLevel(amountCents: number, type: TransactionType): InteractionLevel {
  if (type === "PREMIUM_SESSION") return "PREMIUM_HUMAN";
  if (amountCents >= STANDARD_THRESHOLD_CENTS) return "STANDARD";
  return "BASIC";
}

export function computeTransactionFee(params: {
  provider: PaymentProvider;
  type: TransactionType;
  amountCents: number;
  interactionLevel: InteractionLevel;
}): FeeQuote {
  const { provider, type, amountCents, interactionLevel } = params;

  if (interactionLevel === "STANDARD") {
    const feeCents = Math.round(amountCents * STANDARD_SURCHARGE_PERCENT) + STANDARD_SURCHARGE_FLAT_CENTS;
    return { feeCents, breakdown: `${STANDARD_SURCHARGE_PERCENT * 100}% + ${STANDARD_SURCHARGE_FLAT_CENTS}c standard-tier surcharge` };
  }

  if (type === "TRANSFER" || type === "GOAL_CONTRIBUTION") {
    return { feeCents: INTERNAL_TRANSFER_FLAT_CENTS, breakdown: "flat internal transfer fee" };
  }

  switch (provider) {
    case "CARD": {
      const feeCents = Math.round(amountCents * CARD_PERCENT) + CARD_FLAT_CENTS;
      return { feeCents, breakdown: `${CARD_PERCENT * 100}% + ${CARD_FLAT_CENTS}c card processing` };
    }
    case "WISH_MONEY":
    case "OMT": {
      const feeCents = Math.max(Math.round(amountCents * CASH_IN_PERCENT), CASH_IN_MIN_CENTS);
      return { feeCents, breakdown: `${CASH_IN_PERCENT * 100}% cash-in fee (min ${CASH_IN_MIN_CENTS}c)` };
    }
    case "INTERNAL":
    default:
      return { feeCents: 0, breakdown: "no fee" };
  }
}

export function computePremiumSessionFee(durationMinutes: number): FeeQuote {
  const feeCents = PREMIUM_SESSION_FEES_CENTS[durationMinutes] ?? PREMIUM_SESSION_FEES_CENTS[30];
  return { feeCents, breakdown: `${durationMinutes}-minute human advisory session` };
}

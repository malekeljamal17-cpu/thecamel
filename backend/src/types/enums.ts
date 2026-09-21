/**
 * SQLite (used for zero-config local dev) has no native enum support, so the
 * Prisma schema stores these as plain strings. These TS union types give the
 * app code the same safety a real Prisma enum would. If/when the datasource
 * moves to PostgreSQL, these can be promoted back to real `enum` blocks in
 * schema.prisma and these unions can just re-export `@prisma/client`'s types.
 */

export const TIERS = ["FREE", "PREMIUM"] as const;
export type Tier = (typeof TIERS)[number];

export const KYC_STATUSES = ["PENDING", "VERIFIED", "REJECTED"] as const;
export type KycStatus = (typeof KYC_STATUSES)[number];

export const PAYMENT_PROVIDERS = ["CARD", "WISH_MONEY", "OMT", "INTERNAL"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const TRANSACTION_TYPES = [
  "DEPOSIT",
  "WITHDRAWAL",
  "TRANSFER",
  "FEE",
  "GOAL_CONTRIBUTION",
  "PREMIUM_SESSION",
  "POLICY_PREMIUM",
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_STATUSES = ["PENDING", "COMPLETED", "FAILED", "REVERSED"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const INTERACTION_LEVELS = ["BASIC", "STANDARD", "PREMIUM_HUMAN"] as const;
export type InteractionLevel = (typeof INTERACTION_LEVELS)[number];

export const GOAL_CATEGORIES = [
  "EMERGENCY_FUND",
  "SAVINGS",
  "TRAVEL",
  "EDUCATION",
  "RETIREMENT",
  "HOME_PURCHASE",
  "INSURANCE_LINKED",
  "OTHER",
] as const;
export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export const POLICY_TYPES = ["LIFE", "SAVINGS_PLAN", "LIFE_AND_SAVINGS"] as const;
export type PolicyType = (typeof POLICY_TYPES)[number];

export const POLICY_STATUSES = ["PROPOSED", "ACTIVE", "LAPSED", "MATURED", "CANCELLED"] as const;
export type PolicyStatus = (typeof POLICY_STATUSES)[number];

export const PREMIUM_FREQUENCIES = ["MONTHLY", "QUARTERLY", "ANNUALLY"] as const;
export type PremiumFrequency = (typeof PREMIUM_FREQUENCIES)[number];

export const BOOKING_STATUSES = ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

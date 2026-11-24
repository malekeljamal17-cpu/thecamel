import { prisma } from "../../lib/prisma";
import type { PolicyType, PremiumFrequency } from "../../types/enums";
import { HttpError } from "../../middleware/errorHandler";
import { FEATURES } from "../../config/features";
import { computeTransactionFee } from "../fees/fee.service";
import { awardBadge, recordActivity } from "../gamification/gamification.service";
import { adjustWalletBalance, getWalletByUserId } from "../wallet/wallet.service";

/**
 * Life / savings-plan insurance is modeled as a first-class product that can
 * be added at any time — proposed on its own, then optionally linked to a
 * Goal so its coverage/maturity value counts toward that goal's projection
 * (see goals.service#projectGoal).
 *
 * Phase 1 (see docs/PHASED-LAUNCH.md): Camel Finance is a referral channel
 * to an ICC-licensed insurer, nothing more — we never underwrite, price,
 * or collect a premium ourselves. `requestReferral` is the entire "sale"
 * on our side; the insurer's own licensed staff closes and bills the
 * policy directly with the customer. There used to be a `payPremium`
 * endpoint that debited the user's wallet for the premium — that's
 * exactly the kind of money-handling that would make us look like an
 * insurance intermediary, so it's gone unless/until that's a deliberate,
 * licensed Phase 2 decision.
 */
export async function proposePolicy(userId: string, input: {
  provider: string;
  policyType: PolicyType;
  coverageAmountCents: number;
  premiumAmountCents: number;
  premiumFrequency?: PremiumFrequency;
  startDate?: Date;
  maturityDate?: Date;
}) {
  return prisma.insurancePolicy.create({
    data: {
      userId,
      provider: input.provider,
      policyType: input.policyType,
      coverageAmountCents: input.coverageAmountCents,
      premiumAmountCents: input.premiumAmountCents,
      premiumFrequency: input.premiumFrequency ?? "MONTHLY",
      startDate: input.startDate,
      maturityDate: input.maturityDate,
      status: "PROPOSED",
    },
  });
}

export async function listPolicies(userId: string) {
  return prisma.insurancePolicy.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

/**
 * The user asked to be connected to the insurer for this policy. This is a
 * lead handoff, not a sale — the insurer takes it from here (underwriting,
 * pricing, collecting the first premium) outside this app entirely.
 */
export async function requestReferral(userId: string, policyId: string) {
  const policy = await getOwnedPolicy(userId, policyId);
  return prisma.insurancePolicy.update({
    where: { id: policy.id },
    data: { status: "REFERRED", referredAt: new Date() },
  });
}

export async function linkPolicyToGoal(userId: string, policyId: string, goalId: string) {
  const policy = await getOwnedPolicy(userId, policyId);
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) throw new HttpError(404, "Goal not found");

  const updated = await prisma.insurancePolicy.update({
    where: { id: policy.id },
    data: { goalId },
  });

  await awardBadge(userId, "PROTECTED");
  await recordActivity(userId);

  return updated;
}

/**
 * Phase 2 only (FEATURES.walletEnabled): once Camel Finance actually has a
 * licensed structure for it, premiums could be paid in-app from the
 * wallet. Throws in Phase 1 — see the module docblock above for why
 * premium collection isn't something we do ourselves yet.
 */
export async function payPremium(userId: string, policyId: string) {
  if (!FEATURES.walletEnabled) {
    throw new HttpError(403, "Paying premiums in-app isn't available yet — your insurer bills you directly for now.");
  }

  const policy = await getOwnedPolicy(userId, policyId);
  const wallet = await getWalletByUserId(userId);

  const interactionLevel = "BASIC" as const;
  const feeQuote = computeTransactionFee({ provider: "INTERNAL", type: "POLICY_PREMIUM", amountCents: policy.premiumAmountCents, interactionLevel });
  const totalDebit = policy.premiumAmountCents + feeQuote.feeCents;

  if (wallet.balanceCents < totalDebit) throw new HttpError(400, "Insufficient balance to pay premium");

  await adjustWalletBalance(wallet.id, -totalDebit);

  const transaction = await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      type: "POLICY_PREMIUM",
      provider: "INTERNAL",
      amountCents: policy.premiumAmountCents,
      feeCents: feeQuote.feeCents,
      currency: wallet.currency,
      status: "COMPLETED",
      interactionLevel,
      metadata: JSON.stringify({ policyId: policy.id }),
    },
  });

  await recordActivity(userId);

  return transaction;
}

async function getOwnedPolicy(userId: string, policyId: string) {
  const policy = await prisma.insurancePolicy.findFirst({ where: { id: policyId, userId } });
  if (!policy) throw new HttpError(404, "Policy not found");
  return policy;
}

import { prisma } from "../../lib/prisma";
import type { PolicyType, PremiumFrequency } from "../../types/enums";
import { HttpError } from "../../middleware/errorHandler";
import { computeTransactionFee } from "../fees/fee.service";
import { awardBadge, recordActivity } from "../gamification/gamification.service";
import { adjustWalletBalance, getWalletByUserId } from "../wallet/wallet.service";

/**
 * Life / savings-plan insurance is modeled as a first-class product that can
 * be added at any time — proposed on its own, then optionally linked to a
 * Goal so its coverage/maturity value counts toward that goal's projection
 * (see goals.service#projectGoal). Underwriting itself (risk assessment,
 * pricing, regulatory filing with Lebanon's ICC) happens with a licensed
 * insurance partner — this models the policy record and premium billing on
 * our side of that partnership.
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

export async function activatePolicy(userId: string, policyId: string) {
  const policy = await getOwnedPolicy(userId, policyId);
  return prisma.insurancePolicy.update({
    where: { id: policy.id },
    data: { status: "ACTIVE", startDate: policy.startDate ?? new Date() },
  });
}

export async function linkPolicyToGoal(userId: string, policyId: string, goalId: string) {
  const policy = await getOwnedPolicy(userId, policyId);
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) throw new HttpError(404, "Goal not found");

  const updated = await prisma.insurancePolicy.update({
    where: { id: policy.id },
    data: { goalId, status: policy.status === "PROPOSED" ? "ACTIVE" : policy.status },
  });

  await awardBadge(userId, "PROTECTED");
  await recordActivity(userId);

  return updated;
}

export async function payPremium(userId: string, policyId: string) {
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

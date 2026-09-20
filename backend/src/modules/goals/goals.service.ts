import { prisma } from "../../lib/prisma";
import type { GoalCategory } from "../../types/enums";
import { HttpError } from "../../middleware/errorHandler";
import { classifyInteractionLevel, computeTransactionFee } from "../fees/fee.service";
import { awardBadge, awardPoints, recordActivity } from "../gamification/gamification.service";
import { adjustWalletBalance, getWalletByUserId } from "../wallet/wallet.service";

export async function createGoal(userId: string, input: { name: string; category?: GoalCategory; targetAmountCents: number; targetDate?: Date }) {
  const goal = await prisma.goal.create({
    data: {
      userId,
      name: input.name,
      category: input.category ?? "SAVINGS",
      targetAmountCents: input.targetAmountCents,
      targetDate: input.targetDate,
    },
  });

  await awardBadge(userId, "GOAL_SETTER");
  await recordActivity(userId);

  return goal;
}

export async function listGoals(userId: string) {
  return prisma.goal.findMany({
    where: { userId },
    include: { linkedPolicy: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGoal(userId: string, goalId: string) {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId }, include: { linkedPolicy: true } });
  if (!goal) throw new HttpError(404, "Goal not found");
  return goal;
}

export async function contributeToGoal(userId: string, goalId: string, amountCents: number) {
  if (amountCents <= 0) throw new HttpError(400, "Amount must be positive");

  const goal = await getGoal(userId, goalId);
  const wallet = await getWalletByUserId(userId);

  const interactionLevel = classifyInteractionLevel(amountCents, "GOAL_CONTRIBUTION");
  const feeQuote = computeTransactionFee({ provider: "INTERNAL", type: "GOAL_CONTRIBUTION", amountCents, interactionLevel });
  const totalDebit = amountCents + feeQuote.feeCents;

  if (wallet.balanceCents < totalDebit) throw new HttpError(400, "Insufficient balance");

  await adjustWalletBalance(wallet.id, -totalDebit);

  await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      type: "GOAL_CONTRIBUTION",
      provider: "INTERNAL",
      amountCents,
      feeCents: feeQuote.feeCents,
      currency: wallet.currency,
      status: "COMPLETED",
      interactionLevel,
      goalId: goal.id,
    },
  });

  const wasAlreadyAchieved = goal.currentAmountCents >= goal.targetAmountCents;
  const updated = await prisma.goal.update({
    where: { id: goal.id },
    data: { currentAmountCents: { increment: amountCents } },
  });

  await recordActivity(userId);
  await awardPoints(userId, 15, "Goal contribution");

  const contributionCount = await prisma.transaction.count({ where: { goalId: goal.id, type: "GOAL_CONTRIBUTION" } });
  if (contributionCount === 10) await awardBadge(userId, "FREQUENT_SAVER");

  if (!wasAlreadyAchieved && updated.currentAmountCents >= updated.targetAmountCents) {
    await awardBadge(userId, "GOAL_ACHIEVER");
  }

  return updated;
}

/**
 * Projects when a goal will be reached, factoring in a linked insurance
 * policy's maturity payout if one exists. This is a simplified illustrative
 * projection, not a licensed financial/actuarial calculation.
 */
export async function projectGoal(userId: string, goalId: string) {
  const goal = await getGoal(userId, goalId);
  const remainingCents = Math.max(goal.targetAmountCents - goal.currentAmountCents, 0);

  const policyMaturityCents = goal.linkedPolicy?.status === "ACTIVE" ? goal.linkedPolicy.coverageAmountCents : 0;
  const effectiveRemainingCents = Math.max(remainingCents - policyMaturityCents, 0);

  return {
    goalId: goal.id,
    targetAmountCents: goal.targetAmountCents,
    currentAmountCents: goal.currentAmountCents,
    remainingCents,
    linkedPolicyContributionCents: policyMaturityCents,
    remainingAfterPolicyCents: effectiveRemainingCents,
    onTrack: goal.targetDate ? isOnTrack(goal.createdAt, goal.targetDate, goal.targetAmountCents, goal.currentAmountCents) : null,
  };
}

function isOnTrack(createdAt: Date, targetDate: Date, targetAmountCents: number, currentAmountCents: number): boolean {
  const now = new Date();
  const totalDurationMs = targetDate.getTime() - createdAt.getTime();
  const elapsedMs = now.getTime() - createdAt.getTime();
  if (totalDurationMs <= 0) return currentAmountCents >= targetAmountCents;

  const expectedProgress = Math.min(elapsedMs / totalDurationMs, 1);
  const actualProgress = currentAmountCents / targetAmountCents;
  return actualProgress >= expectedProgress;
}

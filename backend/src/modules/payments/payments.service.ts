import { prisma } from "../../lib/prisma";
import type { PaymentProvider } from "../../types/enums";
import { HttpError } from "../../middleware/errorHandler";
import { classifyInteractionLevel, computeTransactionFee } from "../fees/fee.service";
import { awardBadge, awardPoints, recordActivity } from "../gamification/gamification.service";
import { getWalletByUserId, adjustWalletBalance } from "../wallet/wallet.service";
import type { PaymentAdapter } from "./adapters/types";
import { CardAdapter } from "./adapters/card.adapter";
import { WishMoneyAdapter } from "./adapters/wishmoney.adapter";
import { OmtAdapter } from "./adapters/omt.adapter";

const adapters: Record<PaymentProvider, PaymentAdapter | null> = {
  CARD: new CardAdapter(),
  WISH_MONEY: new WishMoneyAdapter(),
  OMT: new OmtAdapter(),
  INTERNAL: null,
};

function getAdapter(provider: PaymentProvider): PaymentAdapter {
  const adapter = adapters[provider];
  if (!adapter) throw new HttpError(400, `${provider} has no external adapter`);
  return adapter;
}

export async function listPaymentMethods(userId: string) {
  return prisma.paymentMethod.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function addPaymentMethod(userId: string, input: { provider: PaymentProvider; label: string; details: Record<string, string>; isDefault?: boolean }) {
  if (input.isDefault) {
    await prisma.paymentMethod.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  return prisma.paymentMethod.create({
    data: {
      userId,
      provider: input.provider,
      label: input.label,
      detailsJson: JSON.stringify(input.details),
      isDefault: input.isDefault ?? false,
    },
  });
}

export async function depositFunds(userId: string, input: { provider: PaymentProvider; amountCents: number; currency?: string; payerDetails?: Record<string, string> }) {
  if (input.amountCents <= 0) throw new HttpError(400, "Amount must be positive");

  const wallet = await getWalletByUserId(userId);
  const interactionLevel = classifyInteractionLevel(input.amountCents, "DEPOSIT");
  const feeQuote = computeTransactionFee({
    provider: input.provider,
    type: "DEPOSIT",
    amountCents: input.amountCents,
    interactionLevel,
  });

  const transaction = await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      type: "DEPOSIT",
      provider: input.provider,
      amountCents: input.amountCents,
      feeCents: feeQuote.feeCents,
      currency: input.currency ?? wallet.currency,
      status: "PENDING",
      interactionLevel,
      metadata: JSON.stringify({ feeBreakdown: feeQuote.breakdown }),
    },
  });

  const adapter = getAdapter(input.provider);
  const result = await adapter.charge({
    amountCents: input.amountCents,
    currency: input.currency ?? wallet.currency,
    reference: transaction.id,
    payerDetails: input.payerDetails ?? {},
  });

  if (!result.success) {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED", metadata: JSON.stringify({ error: result.failureReason }) },
    });
    throw new HttpError(402, result.failureReason ?? "Payment failed");
  }

  const netCredit = input.amountCents - feeQuote.feeCents;
  await adjustWalletBalance(wallet.id, netCredit);

  const completed = await prisma.transaction.update({
    where: { id: transaction.id },
    data: { status: "COMPLETED", externalRef: result.externalRef, metadata: JSON.stringify(result.rawResponse) },
  });

  await recordActivity(userId);
  await awardPoints(userId, 10, "Wallet top-up");

  const depositCount = await prisma.transaction.count({ where: { walletId: wallet.id, type: "DEPOSIT", status: "COMPLETED" } });
  if (depositCount === 1) await awardBadge(userId, "FIRST_DEPOSIT");

  return completed;
}

export async function withdrawFunds(userId: string, input: { provider: PaymentProvider; amountCents: number; currency?: string; payoutDetails?: Record<string, string> }) {
  if (input.amountCents <= 0) throw new HttpError(400, "Amount must be positive");

  const wallet = await getWalletByUserId(userId);
  const interactionLevel = classifyInteractionLevel(input.amountCents, "WITHDRAWAL");
  const feeQuote = computeTransactionFee({
    provider: input.provider,
    type: "WITHDRAWAL",
    amountCents: input.amountCents,
    interactionLevel,
  });

  const totalDebit = input.amountCents + feeQuote.feeCents;
  if (wallet.balanceCents < totalDebit) throw new HttpError(400, "Insufficient balance");

  const transaction = await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      type: "WITHDRAWAL",
      provider: input.provider,
      amountCents: input.amountCents,
      feeCents: feeQuote.feeCents,
      currency: input.currency ?? wallet.currency,
      status: "PENDING",
      interactionLevel,
      metadata: JSON.stringify({ feeBreakdown: feeQuote.breakdown }),
    },
  });

  // Debit up front to prevent double-spend while the payout call is in flight.
  await adjustWalletBalance(wallet.id, -totalDebit);

  const adapter = getAdapter(input.provider);
  const result = await adapter.payout({
    amountCents: input.amountCents,
    currency: input.currency ?? wallet.currency,
    reference: transaction.id,
    payerDetails: input.payoutDetails ?? {},
  });

  if (!result.success) {
    await adjustWalletBalance(wallet.id, totalDebit); // refund
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED", metadata: JSON.stringify({ error: result.failureReason }) },
    });
    throw new HttpError(402, result.failureReason ?? "Payout failed");
  }

  const completed = await prisma.transaction.update({
    where: { id: transaction.id },
    data: { status: "COMPLETED", externalRef: result.externalRef, metadata: JSON.stringify(result.rawResponse) },
  });

  await recordActivity(userId);
  return completed;
}

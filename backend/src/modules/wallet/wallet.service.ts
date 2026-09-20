import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/errorHandler";

export async function getWalletSummary(userId: string) {
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
  return { balanceCents: wallet.balanceCents, currency: wallet.currency };
}

export async function getTransactionHistory(userId: string, limit = 50) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new HttpError(404, "Wallet not found");

  return prisma.transaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getWalletByUserId(userId: string) {
  return prisma.wallet.findUniqueOrThrow({ where: { userId } });
}

/**
 * Applies a balance change atomically at the database level, so concurrent
 * calls against the same wallet can never both read a stale pre-write
 * balance and both succeed (the classic check-then-act overdraft race).
 * Credits always succeed; debits are a single conditional UPDATE that only
 * matches (and only decrements) when the current balance still covers the
 * debit, so a losing concurrent request sees `count === 0` and fails
 * cleanly instead of racing past the check.
 */
export async function adjustWalletBalance(walletId: string, deltaCents: number) {
  if (deltaCents >= 0) {
    return prisma.wallet.update({
      where: { id: walletId },
      data: { balanceCents: { increment: deltaCents } },
    });
  }

  const debitCents = -deltaCents;
  const { count } = await prisma.wallet.updateMany({
    where: { id: walletId, balanceCents: { gte: debitCents } },
    data: { balanceCents: { decrement: debitCents } },
  });

  if (count === 0) throw new HttpError(400, "Insufficient balance");

  return prisma.wallet.findUniqueOrThrow({ where: { id: walletId } });
}

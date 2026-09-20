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

export async function adjustWalletBalance(walletId: string, deltaCents: number) {
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: walletId } });
  const newBalance = wallet.balanceCents + deltaCents;
  if (newBalance < 0) throw new HttpError(400, "Insufficient balance");

  return prisma.wallet.update({ where: { id: walletId }, data: { balanceCents: newBalance } });
}

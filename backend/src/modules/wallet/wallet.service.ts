import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/errorHandler";
import { partnerLedger } from "../ledger/partner.adapter";

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
 * The authoritative balance change happens on the partner ledger (see
 * modules/ledger/partner.adapter.ts) — this backend never mutates a
 * custodial balance it holds itself. `Wallet.balanceCents` in our own DB
 * is a cached mirror of whatever the partner ledger reports, refreshed
 * here after every successful call; it is not written as a source of
 * truth anywhere else.
 */
export async function adjustWalletBalance(walletId: string, deltaCents: number) {
  if (deltaCents >= 0) {
    await partnerLedger.credit(walletId, deltaCents, walletId);
  } else {
    await partnerLedger.debit(walletId, -deltaCents, walletId);
  }

  const freshBalanceCents = await partnerLedger.getBalance(walletId);
  return prisma.wallet.update({ where: { id: walletId }, data: { balanceCents: freshBalanceCents } });
}

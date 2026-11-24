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
 * is a cached mirror of whatever the partner ledger reports; it is not
 * written as a source of truth anywhere else.
 *
 * After the partner call, we only re-read the wallet — we deliberately do
 * NOT write a separately-fetched balance back here. Writing a snapshot
 * value fetched in a second round trip would race with a concurrent
 * adjustWalletBalance call on the same wallet: two calls' reads and writes
 * can interleave so the call that read first (and so has the staler value)
 * writes last, clobbering the other call's more recent, correct balance.
 * That reintroduces exactly the check-then-act race this module's atomic
 * credit/debit calls exist to prevent.
 */
export async function adjustWalletBalance(walletId: string, deltaCents: number) {
  if (deltaCents >= 0) {
    await partnerLedger.credit(walletId, deltaCents, walletId);
  } else {
    await partnerLedger.debit(walletId, -deltaCents, walletId);
  }

  return prisma.wallet.findUniqueOrThrow({ where: { id: walletId } });
}

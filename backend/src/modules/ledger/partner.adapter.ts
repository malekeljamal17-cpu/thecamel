import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/errorHandler";

/**
 * Phase 2 abstraction. The actual custodian of customer funds is meant to
 * be a BDL-licensed banking / e-wallet partner — a Financial Institution or
 * Electronic Payment Service Provider — not this backend. Camel Finance is
 * a technology/UX layer on top of that partner's ledger; it never becomes
 * the licensed money-holder itself (see docs/PHASED-LAUNCH.md).
 *
 * This interface is what a real partner integration will implement.
 * `MockPartnerLedgerAdapter` stands in for it today, and is also what
 * `FEATURES.walletEnabled = false` keeps unreachable from the API in
 * Phase 1 — see modules/wallet/wallet.service.ts and
 * modules/payments/payments.routes.ts.
 */
export interface PartnerLedgerAdapter {
  getBalance(accountRef: string): Promise<number>;
  credit(accountRef: string, amountCents: number, reference: string): Promise<void>;
  /** Must throw (not silently clamp) if the account can't cover amountCents. */
  debit(accountRef: string, amountCents: number, reference: string): Promise<void>;
}

/**
 * Stands in for the partner's ledger using our own Wallet table, so the
 * rest of the app can be built and tested against the real shape before
 * that partnership exists. The atomic conditional UPDATE here is exactly
 * the guarantee a real partner's ledger API would need to give us over
 * HTTP — a single operation that both checks and moves the balance, so
 * concurrent calls can't both pass a stale sufficiency check (see the
 * project history: this was a fixed security bug, not a style choice).
 */
export class MockPartnerLedgerAdapter implements PartnerLedgerAdapter {
  async getBalance(accountRef: string): Promise<number> {
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: accountRef } });
    return wallet.balanceCents;
  }

  async credit(accountRef: string, amountCents: number): Promise<void> {
    await prisma.wallet.update({
      where: { id: accountRef },
      data: { balanceCents: { increment: amountCents } },
    });
  }

  async debit(accountRef: string, amountCents: number): Promise<void> {
    const { count } = await prisma.wallet.updateMany({
      where: { id: accountRef, balanceCents: { gte: amountCents } },
      data: { balanceCents: { decrement: amountCents } },
    });
    if (count === 0) throw new HttpError(400, "Insufficient balance");
  }
}

export const partnerLedger: PartnerLedgerAdapter = new MockPartnerLedgerAdapter();

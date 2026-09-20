/**
 * Every money-in/money-out rail (card processor, Wish Money, OMT, ...)
 * implements this interface. Swapping a mock for a real integration means
 * writing one new adapter class — nothing above this layer changes.
 *
 * Wish Money and OMT do not publish self-serve developer APIs today; a real
 * integration requires a direct commercial agreement with each network
 * (they typically integrate via a bank/PSP intermediary or a dedicated
 * settlement file exchange). The adapters below model the shape that
 * integration will eventually take so the rest of the app can be built and
 * tested against it now.
 */
export interface ChargeRequest {
  amountCents: number;
  currency: string;
  reference: string; // our internal transaction id, for idempotency
  payerDetails: Record<string, string>; // masked/non-sensitive only
}

export interface ChargeResult {
  success: boolean;
  externalRef: string;
  rawResponse: Record<string, unknown>;
  failureReason?: string;
}

export interface PaymentAdapter {
  readonly provider: string;
  charge(request: ChargeRequest): Promise<ChargeResult>;
  payout(request: ChargeRequest): Promise<ChargeResult>;
}

import type { ChargeRequest, ChargeResult, PaymentAdapter } from "./types";

/**
 * Stand-in for a real card processor integration (Stripe, or a Lebanese
 * acquirer such as Areeba/NCB's gateway). In production this would call the
 * processor's SDK/API with a tokenized card — raw PAN/CVV must never reach
 * this backend directly (use the processor's client-side tokenization).
 */
export class CardAdapter implements PaymentAdapter {
  readonly provider = "CARD";

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    await simulateNetworkLatency();

    if (request.amountCents <= 0) {
      return { success: false, externalRef: "", rawResponse: {}, failureReason: "Invalid amount" };
    }

    return {
      success: true,
      externalRef: `card_mock_${request.reference}`,
      rawResponse: { gateway: "mock-card-gateway", status: "succeeded" },
    };
  }

  async payout(request: ChargeRequest): Promise<ChargeResult> {
    await simulateNetworkLatency();
    return {
      success: true,
      externalRef: `card_payout_mock_${request.reference}`,
      rawResponse: { gateway: "mock-card-gateway", status: "payout_succeeded" },
    };
  }
}

function simulateNetworkLatency() {
  return new Promise((resolve) => setTimeout(resolve, 50));
}

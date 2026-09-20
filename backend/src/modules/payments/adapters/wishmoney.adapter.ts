import type { ChargeRequest, ChargeResult, PaymentAdapter } from "./types";

/**
 * Wish Money (Lebanon) cash-in/cash-out mock adapter. Real integration would
 * require a partnership with Wish Money and typically involves the customer
 * confirming a cash deposit/withdrawal at a physical branch or agent, with
 * the network notifying us via webhook/settlement file once confirmed —
 * i.e. this is likely to be asynchronous in production, not a synchronous
 * charge call. `charge()` here simulates that outcome synchronously for the
 * MVP.
 */
export class WishMoneyAdapter implements PaymentAdapter {
  readonly provider = "WISH_MONEY";

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    await simulateNetworkLatency();
    return {
      success: true,
      externalRef: `wish_mock_${request.reference}`,
      rawResponse: { network: "wish-money-sandbox", status: "confirmed", branch: "mock-branch-001" },
    };
  }

  async payout(request: ChargeRequest): Promise<ChargeResult> {
    await simulateNetworkLatency();
    return {
      success: true,
      externalRef: `wish_payout_mock_${request.reference}`,
      rawResponse: { network: "wish-money-sandbox", status: "cash_out_ready", pickupCode: mockPickupCode() },
    };
  }
}

function mockPickupCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function simulateNetworkLatency() {
  return new Promise((resolve) => setTimeout(resolve, 50));
}

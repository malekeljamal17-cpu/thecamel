import type { ChargeRequest, ChargeResult, PaymentAdapter } from "./types";

/**
 * OMT (Lebanon) cash-in/cash-out mock adapter — same integration shape and
 * caveats as WishMoneyAdapter (see that file for the real-world notes).
 */
export class OmtAdapter implements PaymentAdapter {
  readonly provider = "OMT";

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    await simulateNetworkLatency();
    return {
      success: true,
      externalRef: `omt_mock_${request.reference}`,
      rawResponse: { network: "omt-sandbox", status: "confirmed", branch: "mock-branch-omt" },
    };
  }

  async payout(request: ChargeRequest): Promise<ChargeResult> {
    await simulateNetworkLatency();
    return {
      success: true,
      externalRef: `omt_payout_mock_${request.reference}`,
      rawResponse: { network: "omt-sandbox", status: "cash_out_ready", pickupCode: mockPickupCode() },
    };
  }
}

function mockPickupCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function simulateNetworkLatency() {
  return new Promise((resolve) => setTimeout(resolve, 50));
}

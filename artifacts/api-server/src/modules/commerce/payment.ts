import { createHash } from "node:crypto";
import type { PaymentProvider } from "../providers/contracts";
/** Stateless deterministic simulation. Idempotency and totals are persisted by checkout. */
export class SimulatedPaymentProvider implements PaymentProvider {
  readonly mode = "simulated" as const;
  constructor(private readonly decline = false) {}
  async pay(input: Parameters<PaymentProvider["pay"]>[0]) {
    return {
      paymentId:
        "sim_" +
        createHash("sha256")
          .update(input.marketplaceOrderId + ":" + input.idempotencyKey)
          .digest("hex"),
      status: this.decline
        ? ("declined" as const)
        : ("simulated_paid" as const),
    };
  }
  async refund(input: Parameters<PaymentProvider["refund"]>[0]) {
    return {
      refundId:
        "sim_refund_" +
        createHash("sha256")
          .update(input.paymentId + ":" + input.idempotencyKey)
          .digest("hex"),
    };
  }
}

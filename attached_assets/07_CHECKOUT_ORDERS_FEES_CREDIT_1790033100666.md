# Checkout, Orders, Fees & Credit

## Architecture
One buyer checkout creates:
Marketplace Order
→ Seller Order A
→ Seller Order B
→ Seller Order C

## Checkout
Address, seller-by-seller shipping, promotions/coupons, marketplace credit, estimated tax, simulated payment and total.

## MVP payment
No real processor.
Use PaymentProvider interface + SimulatedPaymentProvider.

Successful demo checkout creates orders, order items, fee allocations, simulated payment, reward/credit events and notifications.

## Fees
Configurable:
- 8% merchandise marketplace fee;
- 0% shipping marketplace fee;
- processing separate;
- promoted listing fee additional when attributable.

## Fixed processing model
Model checkout-level fixed processing fee once, then allocate proportionally across Seller Orders for reporting.

Never multiply fixed processing by card count or number of sellers.

## Order states
- simulated paid;
- awaiting shipment;
- shipped;
- delivered;
- completed;
- issue;
- cancelled;
- partially refunded;
- refunded.

Use explicit allowed transitions.

## Marketplace credit
Simulated ledger only.
Sources: promotional credit, rewards, refund credit.
Can be consumed at simulated checkout.

## Rewards
Support incentives for larger/consolidated/Smart Cart orders. Exact rates configurable.

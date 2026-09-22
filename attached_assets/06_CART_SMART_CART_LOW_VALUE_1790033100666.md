# Cart, Smart Cart & Low-Value Singles

This is one of TROC's most important modules.

## Principle
Very cheap cards must be listable. Optimize economics at seller-order/checkout level.

## Cart
Group items by seller.

For each seller show:
- card count;
- merchandise subtotal;
- seller minimum progress;
- promotion progress;
- free-shipping threshold if eligible;
- shipping estimate;
- handling time;
- reputation.

If below seller minimum, surface:
- Add $X more;
- wishlist matches;
- missing master-set cards;
- same-set cards;
- cards under $1;
- deals.

## Seller minimums
Initial options:
- None
- $2
- $5
- $10

## Smart Cart objective
Minimize:

item prices
- seller promotions
+ seller shipping

Subject to:
- requested product/printing/variant;
- language;
- minimum condition;
- quantity;
- seller minimum;
- availability;
- Canada-only seller eligibility.

Tie-break:
1. fewer packages;
2. better seller reputation;
3. faster handling.

## MVP algorithm
Do not brute force huge combinations.
Use candidate pruning, cheapest baseline, high-overlap seller identification, consolidation passes, threshold/promotion evaluation and bounded local/beam search.

## UI
Compare original vs optimized seller count, merchandise, shipping, discounts and total.
Explain substitutions.

## KPIs
- cards per checkout;
- AOV;
- merchandise per seller-order;
- shipping per card;
- sellers per checkout;
- Smart Cart use/savings;
- conversion.

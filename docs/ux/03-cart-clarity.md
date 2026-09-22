# Lot 03 — Cart clarity

Presentation only, based on independent UX-AUDIT/03-PANIER.md. No authorization, calculation, mutation, storage or API contract changes.

- Distinguish seller line items from quantities.
- Label cart and Smart Cart totals before taxes; explain when tax estimates become available.
- Keep coupon controls collapsed; provide a summary jump link for long carts.
- Identical Smart Cart lines show a neutral no-better-total-found state, no zero savings celebration or recommendation, and return-to-cart instead of applying identical lines. Equal-price but different selections remain reviewable/applicable.
- Checkout service outage provides a return-to-cart action and suppresses the unavailable form; unauthorized remains a separate sign-in state.

Validation: typecheck and lint pass. Eight real local demo browser cases across 390/1440, EN/FR, light/dark: counts, summary anchor, coupon disclosure, unchanged locked selection, unchanged storage, checkout outage, no overflow/page errors, cart axe checks. Mobile FR Smart Cart screenshot inspected. Independent review pending.

Open: C01 printing/finish name is absent from CommerceListing/CartQuote; A owns a separate contract fix. Never inferred from IDs. Authenticated checkout and 20+ line pagination need separate validation; these checks do not claim coverage of those states. No deployment from this task.

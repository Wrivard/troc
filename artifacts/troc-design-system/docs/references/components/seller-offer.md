# Seller offer row

- **Normalized family:** `seller-offer`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/seller-offer.tsx`
- **Planned preview:** `src/preview/demos/seller-offer.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/seller-offer`
- **Exports:** SellerOfferRow
- **Implementation:** New responsive marketplace composition.
- **Dependencies:** SellerBadge; SellerReputation; ConditionBadge; PriceBlock; QuantityControl; Promotion; Button.
- **Required variants/states:** Seller, verification, rating, condition, price, quantity, shipping, promotion, and Add to Cart; unavailable, loading, selected, disabled, and mobile-stacked states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:35`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:394-405`.
- **Sequential chunk:** 5 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.

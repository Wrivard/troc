# Seller offer row

- **Normalized family:** `seller-offer`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/seller-offer.tsx`
- **Preview:** `src/preview/demos/seller-offer.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/seller-offer`
- **Exports:** SellerOfferRow; type: SellerOfferRowProps
- **Implementation:** New responsive marketplace composition.
- **Dependencies:** SellerBadge; `SellerRating` from Seller Reputation;
  ConditionBadge; PriceBlock; QuantityControl; Promotion; Button.
- **Required variants/states:** Seller, verification, rating, condition, price, quantity, shipping, promotion, and Add to Cart; unavailable, loading, selected, disabled, and mobile-stacked states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:35`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:394-405`.
- **Sequential chunk:** 5 of 7 — implemented after Seller Reputation exposed
  `SellerRating` and after Promotion; typechecked, with final browser validation
  pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.

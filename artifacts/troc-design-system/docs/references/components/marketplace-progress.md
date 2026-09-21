# Seller and shipping progress

- **Normalized family:** `marketplace-progress`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/marketplace-progress.tsx`
- **Planned preview:** `src/preview/demos/marketplace-progress.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/marketplace-progress`
- **Exports:** SellerMinimumProgress, FreeShippingProgress, PromotionProgress
- **Implementation:** New marketplace compositions built on Progress.
- **Dependencies:** Progress; Price formatting; translated messages.
- **Required variants/states:** Seller minimum amount, amount remaining, free-shipping threshold, promotion count/amount threshold, reached/complete, and unavailable states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:40-41`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:414-429,480-494`.
- **Sequential chunk:** 5 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.

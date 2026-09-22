# Seller and shipping progress

- **Normalized family:** `marketplace-progress`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/marketplace-progress.tsx`
- **Preview:** `src/preview/demos/marketplace-progress.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/marketplace-progress`
- **Exports:** SellerMinimumProgress, FreeShippingProgress, PromotionProgress;
  types: SellerMinimumProgressProps, FreeShippingProgressProps,
  PromotionProgressProps
- **Implementation:** New marketplace compositions built on Progress.
- **Dependencies:** Progress; Price formatting; translated messages.
- **Required variants/states:** Seller minimum amount, amount remaining, free-shipping threshold, promotion count/amount threshold, reached/complete, and unavailable states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:40-41`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:414-429,480-494`.
- **Sequential chunk:** 5 of 7 — implemented after Progress; typechecked, with
  final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.

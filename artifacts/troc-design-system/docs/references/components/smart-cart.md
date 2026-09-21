# Smart Cart comparison

- **Normalized family:** `smart-cart`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/smart-cart.tsx`
- **Planned preview:** `src/preview/demos/smart-cart.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/smart-cart`
- **Exports:** SmartCartComparison, SmartCartSavingsCallout, SmartCartExplanation
- **Implementation:** New visual-only composition using OrderTotals and Alert; explicitly no optimization algorithm.
- **Dependencies:** OrderTotals; Alert; Seller count/price formatting; translation keys.
- **Required variants/states:** Original versus TROC Smart Cart, seller/card/shipping/total rows, savings callout, explanation text, loading/empty presentation, and mobile stacking.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:43`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:431-459,655-680`.
- **Sequential chunk:** 6 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.

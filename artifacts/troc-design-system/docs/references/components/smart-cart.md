# Smart Cart comparison

- **Normalized family:** `smart-cart`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/smart-cart.tsx`
- **Preview:** `src/preview/demos/smart-cart.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/smart-cart`
- **Exports:** SmartCartComparison, SmartCartSavingsCallout,
  SmartCartExplanation; types: SmartCartColumn, SmartCartSavingsCalloutProps,
  SmartCartExplanationProps, SmartCartComparisonProps
- **Implementation:** New visual-only composition using OrderTotals and Alert; explicitly no optimization algorithm.
- **Dependencies:** OrderTotals; Alert; Seller count/price formatting; translation keys.
- **Required variants/states:** Original versus TROC Smart Cart, seller/card/shipping/total rows, savings callout, explanation text, loading/empty presentation, and mobile stacking.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:43`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:431-459,655-680`.
- **Sequential chunk:** 6 of 7 — implemented and typechecked; final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.

## Milestone 3 validation — 2026-09-22

Commerce integration reuses this family. Shared fixes: progress bars retain accessible names with visible headers; zero-minimum progress is complete; Smart Cart savings text uses the existing primary-text token for light-theme contrast; seller-group metadata wraps on mobile. No token values or brand redesign. EN/FR dark/light browser checks and standalone/integrated guide comparisons passed.

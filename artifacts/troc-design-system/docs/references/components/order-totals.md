# Order totals

- **Normalized family:** `order-totals`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/order-totals.tsx`
- **Planned preview:** `src/preview/demos/order-totals.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/order-totals`
- **Exports:** OrderTotals
- **Implementation:** New tabular monetary summary composition.
- **Dependencies:** Price formatting; translated labels; semantic typography tokens.
- **Required variants/states:** Cards subtotal, shipping, discounts/promotions, total, savings, CAD formatting, sub-dollar precision, and compact/full layouts.
- **Evidence:** `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:480-494,431-459`.
- **Sequential chunk:** 6 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.

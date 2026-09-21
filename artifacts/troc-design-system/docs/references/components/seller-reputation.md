# Seller reputation and account summary

- **Normalized family:** `seller-reputation`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/seller-reputation.tsx`
- **Planned preview:** `src/preview/demos/seller-reputation.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/seller-reputation`
- **Exports:** SellerRating, SellerStats, SellerLevel, SellerPlan
- **Implementation:** New seller metadata composition.
- **Dependencies:** Badge/Status; MetricStat; approved icons; translated labels.
- **Required variants/states:** Rating with review count, stats, level, and plan; unavailable/new seller, compact, full, and non-colour-only status states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:34-36`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:394-413,461-477`.
- **Sequential chunk:** 6 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.

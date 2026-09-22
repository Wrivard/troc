# Seller reputation and account summary

- **Normalized family:** `seller-reputation`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/seller-reputation.tsx`
- **Preview:** `src/preview/demos/seller-reputation.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/seller-reputation`
- **Exports:** SellerRating, SellerStat, SellerStats, SellerLevelBadge,
  SellerLevel, SellerPlanBadge, SellerPlan; types: SellerRatingProps,
  SellerStatProps, SellerLevelTier, SellerLevelBadgeProps, SellerPlanBadgeProps
- **Implementation:** New seller metadata composition.
- **Dependencies:** Badge/Status; approved icons; translated labels. This
  prerequisite must not depend on the later MetricStat family.
- **Required variants/states:** Rating with review count, stats, level, and plan; unavailable/new seller, compact, full, and non-colour-only status states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:34-36`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:394-413,461-477`.
- **Sequential chunk:** 5 of 7 — implemented before Seller Offer; typechecked,
  with final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.

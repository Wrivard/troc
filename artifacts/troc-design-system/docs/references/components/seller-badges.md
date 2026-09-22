# Seller badges

- **Normalized family:** `seller-badges`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/seller-badges.tsx`
- **Preview:** `src/preview/demos/seller-badges.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/seller-badges`
- **Exports:** SellerBadge; types: SellerBadgeKind, SellerBadgeSize,
  SellerBadgeProps
- **Implementation:** New constrained composition built on Badge.
- **Dependencies:** Badge; approved icons; translated labels.
- **Required variants/states:** Verified Seller, Verified Hobby Shop, Top Seller, Founding Seller, and Sponsored; compact/default and icon/text forms with non-colour-only meaning.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:34`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:406-413`.
- **Sequential chunk:** 5 of 7 — implemented and typechecked; final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.

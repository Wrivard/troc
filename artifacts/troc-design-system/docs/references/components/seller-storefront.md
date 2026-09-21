# Seller storefront identity

- **Normalized family:** `seller-storefront`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/seller-storefront.tsx`
- **Planned preview:** `src/preview/demos/seller-storefront.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/seller-storefront`
- **Exports:** SellerAvatar, SellerBanner, SellerStorefrontHeader
- **Implementation:** New responsive seller composition consolidating logo/avatar, banner, and header.
- **Dependencies:** SellerBadge; SellerReputation; Button; image primitives.
- **Required variants/states:** Logo/avatar fallback, optional banner, verified/badge display, actions, loading, compact/mobile, and missing-image states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:36`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:461-477`.
- **Sequential chunk:** 6 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.

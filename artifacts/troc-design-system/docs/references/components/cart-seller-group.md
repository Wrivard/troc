# Seller-grouped cart

- **Normalized family:** `cart-seller-group`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/cart-seller-group.tsx`
- **Preview:** `src/preview/demos/cart-seller-group.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/cart-seller-group`
- **Exports:** CartSellerGroup, CartItem; types: CartSellerGroupProps,
  CartItemProps
- **Implementation:** New cart composition using marketplace primitives; includes cheap-card item treatment and combined shipping summary.
- **Dependencies:** ProductPresentation; PriceBlock; QuantityControl; MarketplaceProgress; Promotion; Button.
- **Required variants/states:** Seller grouping, sub-dollar items, quantity edit, remove, minimum/promotion progress, combined shipping, unavailable item, loading, and mobile states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:42`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:480-494`.
- **Sequential chunk:** 6 of 7 — implemented and typechecked; final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.

## Milestone 3 validation — 2026-09-22

Commerce integration reuses this family. Shared fixes: progress bars retain accessible names with visible headers; zero-minimum progress is complete; Smart Cart savings text uses the existing primary-text token for light-theme contrast; seller-group metadata wraps on mobile. No token values or brand redesign. EN/FR dark/light browser checks and standalone/integrated guide comparisons passed.

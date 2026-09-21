# Product and card presentation

- **Normalized family:** `product-presentation`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/product-presentation.tsx`
- **Planned preview:** `src/preview/demos/product-presentation.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/product-presentation`
- **Exports:** ProductCard, ProductRow, CardImage, CardTitle, CardMetadata
- **Implementation:** New responsive marketplace composition; tile and compact row are variants of one normalized family.
- **Dependencies:** MarketplaceBadge; PriceBlock; Button; Skeleton; semantic aspect-ratio/layout tokens.
- **Required variants/states:** Tile and row, card image loading/missing, title, set/card-number metadata, seller count, available quantity, hover/focus, selected, loading, and narrow/mobile layouts.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:28-29`; `docs/references/specifications/05_STYLE_GUIDE_PAGE_1790026725045.md:15`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:371-393,557-565`.
- **Sequential chunk:** 5 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.

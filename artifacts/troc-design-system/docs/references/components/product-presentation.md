# Product and card presentation

- **Normalized family:** `product-presentation`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/product-presentation.tsx`
- **Preview:** `src/preview/demos/product-presentation.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/product-presentation`
- **Exports:** ProductCard, ProductRow, CardImage, CardTitle, CardMetadata,
  ProductAvailability, CardShowcase; types: ProductCardProps, ProductRowProps, CardImageProps,
  CardTitleProps, CardMetadataProps, ProductAvailabilityProps
- **Implementation:** New responsive marketplace composition; tile and compact row are variants of one normalized family.
- **Dependencies:** MarketplaceBadge; PriceBlock; Button; Skeleton; semantic aspect-ratio/layout tokens.
- **Required variants/states:** Tile and row, card image loading/missing, title, set/card-number metadata, seller count, available quantity, hover/focus, selected, loading, and narrow/mobile layouts.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:28-29`; `docs/references/specifications/05_STYLE_GUIDE_PAGE_1790026725045.md:15`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:371-393,557-565`.
- **Sequential chunk:** 5 of 7 — implemented after Marketplace Price and
  Marketplace Badges; typechecked, with final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.

## Milestone 2.5 extension

CardImage accepts responsive srcSet/sizes, verified width/height and eager loading. Default grids remain lazy. Cached loads, loading skeletons and failures preserve the approved 63:88 contained frame. The family story includes responsive, loading and missing states; browser tests exercise failures without embedding broken URLs into the guide. No tokens or visual styling changed.

## Design polish addition — 2026-09-22

`CardShowcase` accepts up to three caller-supplied card nodes and a localized figure label. It uses static perspective and the existing card image family, preserving full-card proportions, with no animation, new palette or bundled provider artwork. The product-presentation story includes three-card, missing-image and single-card states.

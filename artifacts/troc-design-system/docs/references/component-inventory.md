# TROC component inventory

This is the approval ledger for **46 normalized component families** derived
only from the complete provided TROC specification. Variants and tightly
coupled subcomponents are consolidated into families. All recorded source,
preview, and package paths now exist. Every component source and preview source
is `.tsx` under `src/components/ui/` and `src/preview/demos/`.

## Status policy

- Chunk 1 is the **exact five-family pilot**: Button, Input, Textarea, Select,
  Combobox. All five are **APPROVED — implemented, technically verified, and
  user-approved on 2026-09-21**.
- All **46 families** are implemented and technically verified. Final contract,
  package TypeScript, production build, interaction/composition, and 55-page
  responsive browser checks passed.
- The pilot five are user-approved. The other **41 families await final user
  visual approval**; technical verification and authorization to implement are
  not user approval.
- The implemented source preserves the corrected dependency order. There was no
  additional user-approval gate between authorized chunks; final user visual
  approval remains a separate pending gate.
- “Radix” identifies an accessible primitive dependency, not copied source code.
  All authored component source remains TROC-owned and spec-seeded.
- Combobox is a self-contained native ARIA editable-combobox built with Input and Button; it has no exported Popover dependency.

## Chunk plan

| Chunk | Families | Gate |
|---|---:|---|
| 1. Pilot | 5 | APPROVED — implemented, verified, user-approved 2026-09-21 |
| 2. Core controls | 6 | Implemented and technically verified; final user visual approval pending |
| 3. Overlays and feedback | 9 | Implemented and technically verified; final user visual approval pending |
| 4. Brand and navigation | 6 | Implemented and technically verified; final user visual approval pending |
| 5. Prerequisites, marketplace, collections | 12 | Implemented and technically verified; final user visual approval pending |
| 6. Seller, cart, Smart Cart | 4 | Implemented and technically verified; final user visual approval pending |
| 7. Data display and controls | 4 | Implemented and technically verified; final user visual approval pending |
| **Total** | **46** | |

### Dependency-order correction

The original `5 / 6 / 9 / 6 / 10 / 5 / 5` plan was not fully dependency-safe:
Promotion, Marketplace Progress, and Collection Progress depend on the Progress
primitive, while Seller Offer consumes the actual `SellerRating` export from
Seller Reputation. Progress was therefore moved from chunk 7 and Seller
Reputation from chunk 6 to the start of chunk 5. The corrected sequence is
**`5 / 6 / 9 / 6 / 12 / 4 / 4`**, still totaling 46. This is a ledger
correction, not a newly invented family or another approval gate.

## Chunk 1 — Pilot (APPROVED; implemented and verified)

- [Button](components/button.md) — `button`
- [Input](components/input.md) — `input`
- [Textarea](components/textarea.md) — `textarea`
- [Select](components/select.md) — `select`
- [Combobox](components/combobox.md) — `combobox`

### Verification ledger

Main-agent verification passed:

- package TypeScript and production build;
- all 13 preview pages at 390, 768, 1280, and 1920 px, with no overflow or
  broken images;
- controlled Combobox keyboard, filtering, empty, Escape, Tab, disabled, and
  loading behavior;
- Input search, password, and validation behavior;
- Textarea limit and counter behavior;
- Radix Select keyboard, portal, and focus behavior;
- Button loading behavior and the documented public variant set;
- reduced-motion behavior;
- theme and locale reload persistence, with no uncaught browser errors;
- nested theme samples, computed as dark `#0E0E0E` / `#F4F4F4` and inverse
  light;
- `?theme=dark|light&lang=en|fr` review-state deep links; an explicit user
  preference change clears the query override and persists the new choice; and
- generated `favicon.svg` embeds the faithful supplied custom-leaf PNG rather
  than a generated letter.

The user approved the pilot and authorized completion of chunks 2–7 on
2026-09-21. That authorization removed intermediate implementation gates; it
did not pre-approve the final visuals for the other 41 families.

### Final technical verification ledger

Main-agent evidence passed:

- `scripts/check-contracts.mjs`: all 46 consumer family imports; package
  TypeScript; tokens/styles/preferences exports; translated Dialog, Drawer,
  Toast, and Chip labels; supported Button variants; and consumer/guide CSS
  separation;
- production build with `PORT=21977 BASE_PATH=/`;
- `scripts/check-interactions.mjs`: native controls, quantity clamping, chips,
  tabs, overlays/focus return, nine-Tab Dialog/Drawer containment, Toast, exact
  seller/promotion/Smart Cart copy and values, seller badge meanings, EN/FR and
  light persistence, and reduced motion;
- `scripts/check-compositions.mjs`: search, pagination, cart math/removal,
  seller-offer loading locks, local filters/sorting, inventory
  sort/select/page/state behavior, chart table alternative, and mobile
  search/filter-drawer behavior; and
- strengthened `scripts/check-style-guide.mjs`: 46 matching stories and 55
  pages at 390/768/1280/1920 in dark English plus 390 in light French, without
  overflow, broken images, oversized component logos, clipped header controls,
  unexpected overlays, fallback errors, or uncaught errors.

Main-agent visual review also covered desktop dark Applied, desktop dark Smart
Cart, and mobile light French. This is technical review evidence, not final user
visual approval and not a formal WCAG certification.

## Chunk 2 — Core controls

- [Selection controls](components/selection-controls.md) — `selection-controls`
- [Quantity control](components/quantity-control.md) — `quantity-control`
- [Chips and filter chips](components/chips.md) — `chips`
- [Badge and status](components/badge-status.md) — `badge-status`
- [Tabs](components/tabs.md) — `tabs`
- [Breadcrumbs](components/breadcrumbs.md) — `breadcrumbs`

## Chunk 3 — Overlays and feedback

- [Tooltip](components/tooltip.md) — `tooltip`
- [Popover](components/popover.md) — `popover`
- [Dropdown menu](components/dropdown-menu.md) — `dropdown-menu`
- [Dialog](components/dialog.md) — `dialog`
- [Drawer and sheet](components/drawer.md) — `drawer`
- [Toast](components/toast.md) — `toast`
- [Alert and banner](components/alert.md) — `alert`
- [Loading skeleton](components/skeleton.md) — `skeleton`
- [Empty, error, and success states](components/state-feedback.md) — `state-feedback`

## Chunk 4 — Brand and navigation

- [TROC logo](components/logo.md) — `logo`
- [Global search](components/global-search.md) — `global-search`
- [Site navigation](components/site-navigation.md) — `site-navigation`
- [Locale switcher](components/locale-switcher.md) — `locale-switcher`
- [Theme switcher](components/theme-switcher.md) — `theme-switcher`
- [Pagination](components/pagination.md) — `pagination`

## Chunk 5 — Prerequisites, marketplace, and collections

- [Progress bar](components/progress.md) — `progress` — prerequisite
- [Seller reputation and account summary](components/seller-reputation.md) — `seller-reputation` — prerequisite (`SellerRating`)
- [Marketplace price](components/price.md) — `price`
- [Marketplace badges](components/marketplace-badges.md) — `marketplace-badges`
- [Seller badges](components/seller-badges.md) — `seller-badges`
- [Promotion](components/promotion.md) — `promotion`
- [Seller and shipping progress](components/marketplace-progress.md) — `marketplace-progress`
- [Product and card presentation](components/product-presentation.md) — `product-presentation`
- [Seller offer row](components/seller-offer.md) — `seller-offer`
- [Recently sold ticker item](components/recently-sold.md) — `recently-sold`
- [Notification item](components/notification-item.md) — `notification-item`
- [Collection progress card](components/collection-progress.md) — `collection-progress`

## Chunk 6 — Seller, cart, and Smart Cart compositions

- [Seller storefront identity](components/seller-storefront.md) — `seller-storefront`
- [Seller-grouped cart](components/cart-seller-group.md) — `cart-seller-group`
- [Order totals](components/order-totals.md) — `order-totals`
- [Smart Cart comparison](components/smart-cart.md) — `smart-cart`

## Chunk 7 — Data display and controls

- [Filters and sort controls](components/data-controls.md) — `data-controls`
- [Responsive data table](components/data-table.md) — `data-table`
- [Metric and KPI](components/metric-stat.md) — `metric-stat`
- [Simple chart treatment](components/chart.md) — `chart`

## Cross-cutting evidence

Every family also inherits the mobile-first, keyboard, focus, semantic-label, contrast, touch-target, reduced-motion, responsive-table, and mobile-search requirements in `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:3-18` and `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:596-632`. User-facing copy must remain translation-ready under `docs/references/specifications/07_COPY_I18N_1790026725046.md:3-22`. Visual implementation must use semantic tokens and the locked palette under `docs/references/specifications/02_TOKENS_THEMES_1790026725045.md:3-51`.

The non-family acceptance obligations reread from all 14 retained written
specifications are tracked in
[`milestone-acceptance-audit.md`](milestone-acceptance-audit.md).

Static card-art provenance and usage boundaries are documented in
[`card-artwork.md`](card-artwork.md). Those assets are illustration-only demo
references; reusable components receive image URLs through props, with no live
catalog, inventory, pricing, or sales API.

## Editorial composition supplement — 2026-09-22

The `editorial` guide page documents `EditorialIntro`, `EditorialPanel`, `EditorialCatalogGrid`, and `EditorialIcon` from `components/ui/editorial`. These are composition supplements, not replacements for the original 46 component families. Page titles use level 1; section titles use level 2. Quiet and contrast panels use existing semantic tokens. Decorative backgrounds must not imply a real seller/location or reduce text contrast.

`CardShowcase` supports an opt-in `showroom` variant: first card leads, remaining cards sit behind, at most three cards, bounded mouse perspective, no continuous loop, reduced-motion support. The original static stack remains the default. Only approved catalog art may be passed by the marketplace; guide-only demo art remains inside the guide.

## Marketplace quality compositions — 2026-09-22

See [marketplace compositions](components/marketplace-compositions.md). The editorial guide now demonstrates InteractiveCardStack, MarketplaceProductCard, GameTile, GameHero, SmartCartComparison, SellerPreviewCard, ProductArtworkPanel, StoreHero and PremiumEmptyState. These supplement the original families; CardShowcase remains available for existing consumers. SellerOfferRow gains optional seller link/location without changing its quantity/action contract.

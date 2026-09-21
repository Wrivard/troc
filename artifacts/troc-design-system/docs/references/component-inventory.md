# TROC component inventory

This is the approval ledger for **46 normalized component families** derived only from the complete provided TROC specification. Variants and tightly coupled subcomponents are consolidated into families. Pilot source paths are shipped package paths; later-family paths are planned. Every component source and preview source is `.tsx` under `src/components/ui/` and `src/preview/demos/`.

## Status policy

- Chunk 1 is the **exact five-family pilot**: Button, Input, Textarea, Select,
  Combobox. All five are **IMPLEMENTED (verified; awaiting user visual
  approval)**.
- Chunks 2–7 are pending approval and must not be implemented yet.
- Chunks are sequential and dependency-safe: a chunk may start only after all earlier chunks are approved and complete.
- “Radix” identifies a planned accessible primitive dependency, not imported source code. All authored component source remains TROC-owned and spec-seeded.
- Combobox is a self-contained native ARIA editable-combobox built with Input and Button; it has no exported Popover dependency.

## Chunk plan

| Chunk | Families | Gate |
|---|---:|---|
| 1. Pilot | 5 | IMPLEMENTED — verified; awaiting user visual approval |
| 2. Core controls | 6 | Pending approval after chunk 1 |
| 3. Overlays and feedback | 9 | Pending approval after chunk 2 |
| 4. Brand and navigation | 6 | Pending approval after chunk 3 |
| 5. Marketplace and collections | 10 | Pending approval after chunk 4 |
| 6. Seller, cart, Smart Cart | 5 | Pending approval after chunk 5 |
| 7. Data display and controls | 5 | Pending approval after chunk 6 |
| **Total** | **46** | |

## Chunk 1 — Pilot (IMPLEMENTED; verified; awaiting user visual approval)

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

Verification is technical, not visual approval. Stop after the pilot and wait
for the user's approval before beginning chunk 2.

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

## Chunk 5 — Marketplace and collections

- [Product and card presentation](components/product-presentation.md) — `product-presentation`
- [Marketplace price](components/price.md) — `price`
- [Marketplace badges](components/marketplace-badges.md) — `marketplace-badges`
- [Seller offer row](components/seller-offer.md) — `seller-offer`
- [Seller badges](components/seller-badges.md) — `seller-badges`
- [Promotion](components/promotion.md) — `promotion`
- [Seller and shipping progress](components/marketplace-progress.md) — `marketplace-progress`
- [Recently sold ticker item](components/recently-sold.md) — `recently-sold`
- [Notification item](components/notification-item.md) — `notification-item`
- [Collection progress card](components/collection-progress.md) — `collection-progress`

## Chunk 6 — Seller, cart, and Smart Cart compositions

- [Seller storefront identity](components/seller-storefront.md) — `seller-storefront`
- [Seller reputation and account summary](components/seller-reputation.md) — `seller-reputation`
- [Seller-grouped cart](components/cart-seller-group.md) — `cart-seller-group`
- [Order totals](components/order-totals.md) — `order-totals`
- [Smart Cart comparison](components/smart-cart.md) — `smart-cart`

## Chunk 7 — Data display and controls

- [Responsive data table](components/data-table.md) — `data-table`
- [Metric and KPI](components/metric-stat.md) — `metric-stat`
- [Progress bar](components/progress.md) — `progress`
- [Simple chart treatment](components/chart.md) — `chart`
- [Filters and sort controls](components/data-controls.md) — `data-controls`

## Cross-cutting evidence

Every family also inherits the mobile-first, keyboard, focus, semantic-label, contrast, touch-target, reduced-motion, responsive-table, and mobile-search requirements in `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:3-18` and `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:596-632`. User-facing copy must remain translation-ready under `docs/references/specifications/07_COPY_I18N_1790026725046.md:3-22`. Visual implementation must use semantic tokens and the locked palette under `docs/references/specifications/02_TOKENS_THEMES_1790026725045.md:3-51`.

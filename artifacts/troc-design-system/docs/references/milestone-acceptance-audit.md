# Final milestone acceptance audit

Audit date: **2026-09-21**. All 14 retained written specifications were reread
for this audit. This checklist records source requirements only; it does not add
marketplace features or authorize business logic.

## How to read this audit

This document separates two kinds of evidence:

- **Source/static and technical coverage established:** all 14 written specifications are
  retained and mapped; the 46-family ledger, token/theme sources, bilingual copy
  modules, supplied-brand assets, static card-art provenance, foundations,
  component stories, Mobile page, and bounded Applied composition provide
  inspectable implementation coverage. Final contract/package TypeScript,
  production build, interaction/composition, and responsive 55-page browser
  checks passed for all 46 families.
- **Final user acceptance pending:** checked items below record technical/source
  evidence, not subjective user approval. The pilot five have user approval;
  the 41 post-pilot families do not. Unchecked items are intentionally reserved
  for final user visual/editorial/brand decisions.

The automated/browser evidence is extensive but is not a formal WCAG
certification.

## Final technical evidence

- `scripts/check-contracts.mjs` passed all 46 consumer family imports, package
  TypeScript, token/style/preference exports, translated close/remove-label
  contracts, supported Button variants, and consumer/guide CSS separation.
- The production build passed with
  `PORT=21977 BASE_PATH=/ pnpm --filter @workspace/troc-design-system run build`.
- `scripts/check-interactions.mjs` and `scripts/check-compositions.mjs` passed
  the documented control, overlay/focus, exact-copy/value, local-data,
  cart/table/chart, mobile search, and mobile filter-drawer behaviors.
- Strengthened `scripts/check-style-guide.mjs` passed 46 matching stories and
  all 55 pages at 390/768/1280/1920 in dark English and 390 in light French,
  with no overflow, broken images, oversized component logos, clipped header
  controls, unexpected overlays, fallback errors, or uncaught errors.
- Main-agent screenshots reviewed desktop dark Applied, desktop dark Smart Cart,
  and mobile light French. The current workflow was restarted and its logs were
  clean.

## Exact demo copy and numbers

- [x] Brand copy preserves the exact English source strings:
  **`Canada’s Trading Card Marketplace`**,
  **`Built here. For collectors here.`**,
  **`Collect. Trade. Belong.`**,
  **`More cards. Less shipping.`**,
  **`Sell cards. Keep more.`**, and
  **`One search. Every seller.`** Concise French equivalents are implemented;
  final editorial signoff remains pending below.
  Evidence: `specifications/01_BRAND_DIRECTION_1790026725044.md:3-17`;
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:32-48`.
- [x] Seller-minimum progress shows **`$1.42 / $5 minimum`** and
  **`Add $3.58 more from this seller`**.
  Evidence:
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:414-422`.
- [x] Promotion progress shows
  **`Add 3 more cards to unlock 10% off`**.
  Evidence:
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:423-429`.
- [x] The Smart Cart visual comparison uses all exact values:

  | | Sellers | Cards | Shipping | Total |
  |---|---:|---:|---:|---:|
  | Original | 8 | $22.41 | $19.82 | $42.23 |
  | TROC Smart Cart | 3 | $24.87 | $7.44 | $32.31 |

  It also shows **`You save $9.92`** and the explanation
  **“This card costs $0.06 more from this seller but saves $1.24 in
  shipping.”** This remains visual only; no optimization algorithm.
  Evidence:
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:431-459`.
- [x] Cart and price examples visibly support cards priced below **$1**; this
  is a core product principle, not an edge case.
  Evidence:
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:480-494`.
- [x] Demo prices use **CAD**. Realistic example games may include Pokémon,
  Magic: The Gathering, Yu-Gi-Oh!, One Piece, and Riftbound. Demo metrics must
  not imply real business traction.
  Evidence:
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:635-652`.

## Marketplace, seller, promotion, and cart compositions

- [x] Product examples include tile and row forms plus image container, title,
  set/card-number metadata, Reference Price, Lowest Available, Seller Count,
  Available Quantity, and condition/language/game/set/variant badges.
  Evidence:
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:371-393`.
- [x] A seller offer row includes Seller, seller verification, rating,
  condition, price, quantity, shipping, promotion, and Add to Cart.
  Evidence:
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:394-405`.
- [x] Seller badges include all five exact meanings: **Verified Seller,
  Verified Hobby Shop, Top Seller, Founding Seller, Sponsored**.
  Evidence:
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:406-413`.
- [x] Seller progress covers minimum-order, free-shipping, and promotion
  progress; free shipping must not disappear behind only the supplied
  minimum/promotion copy examples.
  Evidence:
  `specifications/04_COMPONENT_LIBRARY_1790026725045.md:34-43`;
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:414-429`.
- [x] Seller visuals include storefront header, logo/avatar, banner, rating,
  stats, level, plan, badges, promotion card, inventory table, and order-status
  indicator.
  Evidence:
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:461-477`.
- [x] Cart visuals include seller grouping, cheap-card items, seller minimum
  progress, promotion progress, combined shipping, and order totals.
  Evidence:
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:480-494`.

## Header, search, and mobile navigation

- [x] Desktop header contains: TROC logo, Shop, Sell, Collect, Search, EN / FR,
  Theme, Sign in/account, and Cart.
- [x] Mobile contains: TROC logo, Search, Cart/account, and a bottom-navigation
  or other appropriate mobile-navigation concept.
- [x] Navigation stays restrained and is not overpopulated. Search/filter
  behavior is designed for mobile, and representative components are shown at
  mobile sizes.
  Evidence:
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:529-565`;
  `specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:3-18`.

## Feedback, states, and interactive coverage

- [x] Feedback/overlay coverage includes Toast, Alert, Dialog, Drawer, Dropdown,
  Popover, Tooltip, Loading skeleton, Empty state, Error state, and Success
  state.
  Evidence:
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:496-513`.
- [x] Every interactive component demonstrates default, hover, focus-visible,
  active, disabled, loading, and validation error where relevant.
  Evidence: `specifications/04_COMPONENT_LIBRARY_1790026725045.md:50-58`.
- [x] Form controls demonstrate normal, focus, filled, error, disabled, and
  helper text. Buttons demonstrate default, hover, pressed, focus, disabled,
  and loading.
  Evidence:
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:323-370`.
- [x] Status is never communicated only by color. Dialogs/dropdowns are
  accessible; errors are associated and readable; icon buttons have
  screen-reader labels.
  Evidence:
  `specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:7-18`;
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:596-612`.

## EN/FR and copy

- [x] EN / FR switcher exists; browser language can set the initial locale,
  explicit user choice overrides it, and that choice persists.
- [x] Visible reusable-component copy is supplied through translation-ready
  labels/keys rather than buried English strings.
- [x] Several components are demonstrated in both languages, all six slogans
  have French equivalents, the seller-minimum sentence is translated, French
  descriptors no longer use “marketplace”, and controls remain usable with
  longer French labels.
- [x] Implemented tone is concise, confident, human, practical, not hype-heavy, with no
  long SaaS marketing paragraphs.
  Evidence: `specifications/07_COPY_I18N_1790026725046.md:3-22`;
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:238-255`.

## Source assets and locked brand

- [x] Use the supplied italic, forward-moving TROC wordmark faithfully: white on
  dark by default, black on light, custom red leaf beside it.
- [x] Never recreate the wordmark with a normal font. Never replace the leaf
  with an emoji, Canadian flag emoji, generic icon-library leaf, random leaf, or
  official Canadian flag leaf. A future final SVG must be swappable without
  layout changes.
- [x] Logo presentation covers primary, dark-background, light-background,
  monochrome, compact/icon, clear-space, minimum-size, wordmark-only, and
  wordmark-plus-provisional-leaf usage. Never stretch/skew the raster.
  Evidence: `specifications/03_TYPOGRAPHY_LOGO_1790026725045.md:19-31`;
  `specifications/01_BRAND_DIRECTION_1790026725044.md:33-41`;
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:105-131,270-285`.
- [x] Canadian identity is strong in positioning but restrained in decoration:
  no repeated leaf wallpaper, flags everywhere, hockey motifs, souvenir-brand
  clichés, rainbow TCG styling, cartoon/gaming clichés, or generic SaaS art.
  Evidence: `specifications/01_BRAND_DIRECTION_1790026725044.md:30-41`;
  `specifications/replit_1790026725047.md:3-18`.

## Responsive and visual-system checks

- [x] Validate mobile, tablet, desktop, and large desktop. Do not allow
  horizontal overflow, unusable mobile tables, tiny tap targets, clipped
  dialogs, or desktop-only interactions. Dense tables may become cards/drawers
  or scroll appropriately.
  Evidence:
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:614-632`;
  `specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:3-18`.
- [x] Use 120–220 ms purposeful motion and respect reduced motion. Use a
  4px/8px-derived spacing scale, controlled small/medium radii, and very subtle
  shadows; dark mode should prefer borders/surface separation.
  Evidence: `specifications/02_TOKENS_THEMES_1790026725045.md:41-51`.
- [x] Red is intentional for major CTAs, selected states, active navigation,
  important highlights, brand moments, and subtle details—not the whole UI.
  Introduce no green, blue, purple, or other accent theme. Card art supplies
  most secondary color.
  Evidence:
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:75-102`.
- [x] Favor clean, compact, structured, fast, scannable UI. Do not overuse
  cards-inside-cards, huge rounded corners, shadows, gradients, animation,
  decorative illustration, giant empty heroes, or glass effects.
  Evidence:
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:566-593`.

## Requirements not represented by a component family

These obligations sit outside the 46-family inventory and must be reconciled
separately:

- [x] `/style-guide` is implemented as a structured living design-system site
  and visual source of truth, not an unstyled list or static brand-board image.
- [x] The route contains the full foundation material: brand overview; logo
  lockups/clear space; color tokens and accessible contrast; dark/light
  comparison; complete typography hierarchy with marketplace examples; and
  spacing, containers, responsive grid, radii, borders, shadows, section
  spacing, and desktop/tablet/mobile behavior.
- [x] Include a **small mock marketplace hero/component composition** using the
  approved branding, but do not build a full homepage.
  Evidence: `specifications/05_STYLE_GUIDE_PAGE_1790026725045.md:3-25`;
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:257-321`.
- [x] Theme architecture is extensible, TROC Dark is default, TROC Light works,
  preference persists locally, and no additional themes are designed now.
  Evidence:
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:184-201`.
- [x] Typography includes Display, H1–H4, Body Large/Body/Body Small, Label,
  Caption, marketplace metadata, Price Large/Small, and tabular/numerical data;
  the modular hierarchy additionally calls for H5–H6 and table text. Use a
  legally usable sans-serif and never use it to reconstruct the logo.
  Evidence: `specifications/03_TYPOGRAPHY_LOGO_1790026725045.md:3-17`;
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:203-235`.
- [x] Technical reconciliation includes rereading supplied files, dark/light, mobile,
  desktop, keyboard/focus, EN/FR, primitive reuse, scope, and logo-direction
  checks. The completion report must state what was created, main file/component
  structure, tokens/themes, decisions not explicitly specified, and remaining
  visual-approval items.
  Evidence:
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:682-708`;
  `specifications/08_ACCEPTANCE_CHECKLIST_1790026725046.md:3-19`.

## Scope boundary

- [x] Build reusable **visual** components and demos only. Do not implement
  authentication, Supabase/marketplace databases, card catalog APIs, payments
  or Stripe, seller onboarding/dashboard backends, checkout, Smart Cart
  optimization, collection/admin backends, order processing, shipping/Canada
  Post APIs, marketplace APIs, scanner, full marketplace pages, or a full
  homepage.
  Evidence: `specifications/00_START_HERE_1790026725044.md:18-19`;
  `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:655-680`.

## Pending subjective user review

- [ ] Final user visual approval of the 41 post-pilot families and complete
  style guide.
- [ ] Final Canadian/Quebec French editorial review.
- [ ] User confirmation or revision of the provisional one-leaf-width clear
  space and 24 px minimum logo size.
- [ ] Replacement of the provisional supplied raster logo with the final
  production SVG when supplied, followed by final brand-art approval.
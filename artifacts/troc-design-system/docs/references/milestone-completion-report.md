# TROC design-system milestone completion report

Reconciled on **2026-09-21** from the working-tree package APIs and retained
source specifications. This reports implementation coverage, not final visual
approval.

## What was built

- A reusable React/web design-system package with **46 normalized public
  component families** and one lazy-loaded story for each family.
- A living `/style-guide` structured as **55 pages**: Overview, four foundation
  pages, 46 family pages, Voice, Accessibility, Mobile, and one bounded Applied
  marketplace composition.
- TROC Dark (default) and TROC Light, English/Canadian French preferences,
  responsive/accessibility guidance, local interactive demos, static
  illustration-only card art, and faithful raster logo variants.
- Visual seller, product, cart, Smart Cart, navigation, feedback, and data
  compositions only. No authentication, catalog/inventory/pricing API,
  database, payment, checkout, order, shipping, scanner, optimization, or other
  marketplace backend was built.

## Source and package structure

- `tokens.json` is the authored DTCG token source.
- `scripts/build-tokens.mjs` combines `scripts/theme-template.css`,
  `scripts/component-styles.css`, and `scripts/components/*.css` into generated
  consumer CSS at `src/index.css`; it also generates
  `src/generated/tokens.tsx` and `public/favicon.svg`.
- `scripts/preview.css` and `scripts/applied-examples.css` are guide-only and
  never consumer style inputs.
- `src/components/ui/<family>.tsx` contains the 46 public web families, exported
  through `@workspace/troc-design-system/components/ui/<family>`.
- `src/preview/demos/<family>.tsx` contains the matching stories.
  `src/preview/pages/applied.tsx` and `mobile.tsx` are local demonstrations, not
  application pages.
- `src/hooks/use-preferences.tsx` supplies optional theme/locale preferences.
  `src/lib/messages*.tsx` contains bilingual guide/demo copy. Components remain
  provider-independent and accept caller-supplied visible/accessibility labels.
- `src/assets/brand/` contains bundled consumer-safe raster artwork;
  `public/brand/` contains review/download copies. `src/assets/cards/` contains
  static demo illustrations governed by `card-artwork.md`.

## Tokens, themes, and explicit design decisions

- The locked palette preserves brand red **`#FF2D3D`**. The separately approved
  action red **`#DE1E30`** supports small white action labels at **4.85:1**.
- **Plus Jakarta Sans** is the approved implementation font, bundled locally
  under the Open Font License.
- Public theme names are **TROC Dark** and **TROC Light**; the longer milestone
  brief supersedes the older “Canada Dark/Light” labels.
- Status colors remain neutral in this milestone and pair text/icons with color.
- One leaf-width logo clear space and a 24 px minimum rendered height are
  **provisional non-spec guidance**, not final brand approval.
- Supplied raster wordmark/leaf shapes are preserved rather than redrawn. A
  final supplied production SVG remains the preferred replacement and must be
  swappable without changing layout.

## Copy and localization coverage

The Voice/brand surfaces include all six approved English strings with paired
French copy: “Canada’s Trading Card Marketplace”, “Built here. For collectors
here.”, “Collect. Trade. Belong.”, “More cards. Less shipping.”, “Sell cards.
Keep more.”, and “One search. Every seller.”

The earlier localization findings are resolved: seller-minimum copy now uses
the translated message source, every English slogan has a French equivalent,
and French descriptors no longer use “marketplace”. The Applied introduction
also identifies its offers as samples rather than live data. Final French
editorial review remains a user review item.

Static-art integrity was also reconciled: the Luffy illustration is identified
as OP05-060, matching its artwork, while inventory-table metadata remains a
clearly independent sample.

## Verification and approval status

- The original five-family pilot is implemented, technically verified, and
  user-approved.
- All 46 families passed final contract/package TypeScript verification,
  including consumer imports, token/style/preference exports, translated
  close/remove-label contracts, supported Button variants, and separation of
  guide layout from consumer CSS. The production build also passed.
- Interaction and composition suites passed, including overlay focus behavior,
  exact marketplace copy/values, local filters/sorting, cart math, inventory
  states, chart data alternatives, mobile search, and filter drawer behavior.
- The strengthened browser suite passed all 55 pages at
  390/768/1280/1920 in dark English and 390 in light French without overflow,
  broken images, clipped controls, fallback errors, or uncaught errors.
- Main-agent screenshots reviewed desktop dark Applied, desktop dark Smart Cart,
  and mobile light French. Auto-logo sizing and the mobile search row/focus
  order were corrected while retaining source logo proportions.
- The 41 post-pilot families are technically verified but **not yet
  user-approved**. Final user visual approval remains pending.
- Final visual approval, final Canadian French review, user review of the
  provisional one-leaf-width clear space and 24 px minimum size, and replacement
  with the final production SVG remain open acceptance items.

These checks establish implementation evidence, not formal WCAG certification.

See `component-inventory.md` for exact family exports and
`milestone-acceptance-audit.md` for the final browser/visual checklist.
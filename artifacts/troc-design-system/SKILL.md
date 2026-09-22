# TROC design-system usage

## Purpose

Use `@workspace/troc-design-system` as TROC's visual source of truth. The package is for reusable, product-agnostic visual components and semantic tokens. It does not authorize marketplace pages, authentication, databases, payments, checkout, seller workflows, Smart Cart optimization, shipping integrations, or other business logic.

## Brand

TROC is Canada's trading card marketplace: premium, modern, minimalist, fast, confident, trustworthy, collector-focused, technology-forward, and distinctly Canadian without souvenir-brand clichés. Primary messaging is “Built here. For collectors here.” Supporting lines include “Collect. Trade. Belong.”, “More cards. Less shipping.”, “Sell cards. Keep more.”, and “One search. Every seller.”

Use the locked black/charcoal, white/off-white, grey, and TROC red direction. Red is intentional emphasis for major calls to action, selected or active states, important highlights, and key brand moments—not a page-wide background. Card art should provide most secondary colour. Avoid rainbow TCG styling, childish or generic gaming visuals, generic SaaS/Shopify treatments, decorative gradients, glass effects, excessive shadows, giant rounded corners, and maple-leaf decoration.

The supplied italic, forward-moving TROC wordmark is authoritative. Use the retained logo asset faithfully and preserve its aspect ratio. Do not typeset a replacement wordmark. The leaf direction is custom and provisional: never substitute an emoji, generic icon-library leaf, random leaf, or official Canadian flag leaf. Keep logo composition swappable for a future final SVG.

Public logo variants are crops or monochrome/white-wordmark recolourings of the supplied raster; no shapes are redrawn. One leaf-width of clear space and a 24 px minimum rendered height are provisional guidance pending approval.

## Component use

- Import tokens/styles and components directly from this package; do not copy them into consumers.
- Use semantic tokens only. Support TROC Dark by default and TROC Light; do not create extra colour themes without approval.
- Preserve brand red `#FF2D3D`; white-labelled actions use action red `#DE1E30` for 4.85:1 contrast.
- Prefer clean, compact, structured, scan-friendly compositions with generous hierarchy. Avoid cards inside cards and decoration that obstructs dense marketplace information.
- Keep every visible string translation-ready for English and natural Canadian/Quebec French. Components receive labels/copy rather than embedding English.
- Design mobile-first with usable touch targets, then expand through consistent breakpoints. Prevent horizontal overflow and clipped overlays; responsive tables may scroll or become cards/drawers.
- Target WCAG AA where practical: semantic HTML, labels, keyboard operation, visible focus, accessible errors and overlays, sufficient contrast, reduced motion, screen-reader names for icon controls, and status meaning beyond colour.
- Use CAD examples and realistic trading-card demo content only in previews. Never imply demo metrics are business traction.

## Inventory and approval gates

Read `docs/references/component-inventory.md` before adding components. The inventory contains 46 normalized web families in seven sequential chunks with corrected counts `5 / 6 / 9 / 6 / 12 / 4 / 4`. The five-family pilot is approved and verified; chunks 2–6 bring the implemented/typechecked total to 42. The final four data families and stories are implemented but await main-agent typecheck evidence. All 41 post-pilot families still await final main-agent browser/visual acceptance and are not user-approved merely because implementation was authorized. Read `docs/references/milestone-acceptance-audit.md` and `docs/references/milestone-completion-report.md` for final reconciliation, and `docs/references/card-artwork.md` before using static demo card images; those images are illustration-only and never imply a live catalog API.

Each authored component and preview module is `.tsx`. Keep its family record, implementation, preview story, public exports, variants, and states aligned. Evidence and retained source uploads live under `docs/references/`.
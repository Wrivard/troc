# Shared CardImage corner correction

Candidate based on ad73c3e. Scope: CardImage in shared product-presentation.tsx and its index.css rules only; no catalog/provider/controller/asset changes. A alone integrates/pushes. Shared preview4313 rebuilt, existing processes reused.

## Diagnosis and correction

Actual Angel's Feather product regression failed with205 bright corner pixels at441px. Raw original Angel/Akki assets have opaque white pixels outside physical rounded corners; Bulbasaur has transparent corners. Loaded product had zero skeletons. Isolated244px probe: current38 white corner pixels; no-skeleton38; exact-ratio wrapper28; image-bound rounding0. Probe screenshot actually inspected. Source assets untouched.

Round image bounds with proportional4.75%/3.4% radii. Keep63:88 outer layout slots/padding. Center the image and fit its natural ratio using container query width/height; cache/load paths update the ratio from the actual image. This maintains full artwork and upscales responsive sources to fill available space. No source-specific whiteness detection, universal zoom or asset processing. Initial auto-size approach underfilled mobile images; visual inspection caught it, sizing was corrected and fill assertions added. Initial4% radius left a thin rim; final radius inspected on Lightning Bolt.

Uses modern CSS size containers/cqw/cqh and :has, tested in installed Chrome. Other browser engines remain an independent compatibility check. No per-image ResizeObserver or DOM measurement loop.

## Author evidence

- Marketplace typecheck PASS; lint PASS after browser globals in new tests corrected. Final test formatting/lint rerun recorded with commit.
- Client and SSR production builds PASS.
- tests/card-image-corners.mjs: actual Angel's Feather product red205 -> green0 bright corner pixels.
- tests/card-image-consumers.mjs:1440ENdark/390FRlight actual shelf geometry, fill/nooverflow; style-guide editorial cards loaded before capture;15 synthetic/local-source shape cases at32/96/180px covering Magic, transparent Pokemon, white border, landscape and tall portrait. Fixture assets are isolated browser diagnostics, never catalog entries.
- tests/card-image-states.mjs: actual product delayed loading -> loaded skeleton removal, alt, broken-image accessible fallback in EN/FR PASS. Initial harness unroute/continue race fixed with a held promise; final run PASS.
- Local evidence:verification/card-corner-probe.json/.jpg/.mjs, card-corners-consumers.json, card-corners-shapes.jpg, card-corners-shelf-1440.jpg, card-corners-shelf-390.jpg, card-corners-style-guide.jpg. Do not commit screenshots.
- Actually inspected: original four-way probe; initial shape matrix/desktop shelf/mobile shelf/styleguide; corrected mobile shelf and loaded guide; FINAL4.75% guide. Other final captures measured, not all reinspected. No assertion-only claim of full platform visual approval.

## Independent gates / next scope

UX1 review required: actual home/catalog/product/cart/store consumers and representative dimensions/themes; real white borders/full art, loading/fallback. UX2 should run only affected community shared-image check, not repeat unchanged12route matrix. Category backs that do not use CardImage are not automatically certified by this correction. True200% zoom still OPEN. No hosted verification/push claim.

UX2 separately reported ad73c3e integrated About/community/CTA scoped PASS in root UX-AUDIT/PAIR-2/06-INTEGRATED-COMMUNITY.md:4responsive cases,12 actual ENFR keyboard destinations,16captures4actually inspected. This does not close broader platform pages or zoom.

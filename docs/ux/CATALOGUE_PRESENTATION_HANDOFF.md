# D18 catalogue presentation handoff

2026-09-23. Design author candidate on 6de61f2; source SHA is the commit containing this report. Catalogue presentation only. Independent acceptance pending; no GitHub push or deployment.

## Changes and boundaries

- Normal `/search` and existing `/search?max=99` use the same composition. Desktop 264px sidebar, prominent query/sort row, removable existing chips, contextual Apply, mobile approved Drawer, persistent large/compact/list views.
- Approved RadioGroup expresses actual single-selection semantics. Set search/show-more uses actual provided sets, preserves selection and draft across resize. Price inputs remain integer cents with CAD helper. No unsupported stock/shipping filters, invented counts or favorites.
- Existing result renderer, artwork, prices, seller quantities, canonical product links, cursor links and chip removal callbacks reused. Filter submission remains FormData to existing URL/reload flow; changes reset cursor. Retain seller parameter when refining seller-scoped URLs.
- Search-only loading JSX uses approved Skeleton and remembered view. PublicClient effects/fetch/abort/error/retry unchanged. Game/set/store/product/home remain on their existing branches.
- Added four icons to existing EditorialIcon API and documented them in style-guide editorial page. No palette/token replacement. Catalogue styles are scoped in a separate CSS file.
- Coordinator-owned hero v4 asset/HomeSections/CSS are a separate checkpoint. A owns product-only work in its own checkout; no broad PublicMarketplace replacement during integration.

## Author checks

PASS marketplace TypeScript, application/tests lint, client production build, SSR production build.

`node tests/catalog-presentation-preview.mjs`: five cases (1440 EN dark;1920 FR light under-$1;834 EN dark;390 FR light under-$1;320 FR dark), each three views. No horizontal overflow. Links and result copy identical across views; view survives reload. Desktop4 large /5-6 compact; tablet3/4; narrow mobile2; list1. Visible artwork waits for loaded natural dimensions. Mobile drawer focus remains inside for15 Tab presses; Escape closes and restores trigger focus.

`node tests/catalog-interactions-preview.mjs`: real combined query/game/NM/max99/price-sort submission; chip removal preserves other filters; browser Back restores chip; empty search and focus recovery; real cursor/first navigation; mobile draft Apply resets cursor. All PASS. Initial test-only assumptions corrected from Price to existing Lowest price and yugioh to canonical yu-gi-oh.

`node tests/catalog-controls-preview.mjs`: set search/show-more, responsive draft preservation, native negative-price rejection; delayed API skeletons large/compact/list. All PASS.

Local `verification/catalog-style-guide.mjs`: new icon section and existing editorial shelf visible; loaded shelf image actually inspected. Not an exhaustive style-guide regression.

## Visual inspection ledger

Final captured set: verification/catalog-{width}-{locale}-{theme}-{large,compact,list}.jpg plus drawer captures at834/390/320. Captured does not mean inspected.

Actually inspected: final1440 EN dark large/list; final320 FR dark large; corrected1920 FR light compact and320 FR dark list;390 light drawer; style-guide icon/metrics section and loaded existing shelf. Initial empty-art screenshots exposed wrapper collapse; fixed [data-catalog-artwork] width and enforced rendered-image wait. Initial unresolved color tokens corrected to approved resolved --color-* variables. Some earlier captures preceded all lazy artwork; final matrix waits for every in-view image.

Evidence JSON: verification/catalog-presentation.json, catalog-interactions.json, catalog-controls.json. Local screenshots excluded from Git.

## Limits / next reviewer scope

Independent UX/B acceptance pending. Chromium desktop emulation only; physical touch, other engines, true200% browser zoom and screen-reader journey remain open. No production/backend readiness claim. Result count is explicitly this page because total/facets are not in the contract. Rarity/finish options remain bounded to current results plus selection, as before. No full multi-select/reactive API redesign.

Native CUA failed before access with known H016 sandbox apply deny-read ACLs despite user preview permission. Reported to Recovery; existing authorized Playwright local preview succeeded. No account/config repair or repeated CUA attempts.

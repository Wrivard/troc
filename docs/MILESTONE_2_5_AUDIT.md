# Milestone 2.5 / Phase A audit

## Outcome

Phase A is **blocked on representative live artwork**, not complete. The user authorizes Milestone 3 only after this gate passes. Milestone 3 implementation and its economics/security/fulfillment audits have not started. Milestone 4 is not authorized.

Review baseline: 900fd18...016dfc7 (Milestone 2.5). Numbered specifications and the latest attached A–D request govern this review. The existing guide remains the visual source of truth.

## Standards

The independent standards review found one hard data-integrity issue: independently valid image/product/provenance foreign keys could misattribute approved source evidence from another product. Migration 0006 and a defensive read check now prevent this. The follow-up review identified variant imports deleting shared art; explicit replacement scopes and a two-language regression resolve that issue. Future CDN activation must retain operator-approved origin validation; no arbitrary server fetch or public image-writing endpoint exists.

## Spec

The independent spec review found three gaps:
1. Real representative catalog remains absent: 15 fictional products, one fictional set per game, no live artwork. Still blocked pending demo-source approval.
2. Importer did not populate the image tables, and the resolver suppressed legacy imported art. Fixed by transactional manifest import with stable canonical IDs and a live-approved legacy compatibility path.
3. Initial image tests did not prove responsive selection, variant artwork or sealed containment. Added synthetic multi-size/front/back/variant/sealed fixtures across twelve viewport/language/theme combinations. Real publisher-art/cache acceptance remains blocked and is not claimed.

No Milestone 3 scope creep or unofficial Riftbound assets was found. The minimal Canadian brand treatment and homepage logo behavior are retained.

## Fixes and architecture

- Image validation bounds dimensions, image count, rendition count, scopes and external identifiers. Sources require HTTPS; delivery URLs require first-party catalog-art paths or configured CDN origins.
- Imports use the existing moderator authorization, provider/source approval and per-row transaction. Failed replacements leave prior manifests untouched. Reordering/repeating manifests preserves canonical image IDs.
- Product and variant manifests replace only explicitly targeted scopes; shared product art survives unrelated language imports.
- New manifests and legacy image URLs have separate display semantics. Removing a manifest does not resurrect its historical provenance as a visible image. Source revocation still removes both paths.
- Database checks reject cross-product provenance and prevent rebinding referenced provenance. Read checks repeat the identity validation.
- Asset response assembly uses indexed maps in a single batch. No new all-catalog fetch or offer query is introduced.
- Cached image completion is checked before retaining the skeleton; approved fixed-frame containment and fallback styling remain unchanged.

## Validation

- Both pinned pnpm frozen install modes passed in the existing workspace.
- Typecheck, lint, 50 unit/domain/SQL tests, full workspace production build and Vercel production build passed.
- 12 new synthetic image-state combinations passed: loading layout stability, currentSrc rendition choice, variant switching, sealed aspect containment, front/back switching, EN/FR and dark/light at 390/768/1280px.
- Eight standalone/integrated style-guide comparisons remain pixel-identical; theme/language persistence passed.
- Public route audit exercises six routes at four widths, two languages and two themes. It verifies the current demo UI, not live publisher-art readiness.
- Built serverless SSR/API smoke checks passed.

## Connected services

Supabase MCP lists no public/troc application tables. Security and performance advisors return no findings; this is not evidence that nonexistent order/inventory policies were verified. No hosted migrations were applied. Sentry organization has no configured project and therefore no actionable traces/issues to inspect.

## Remaining gate / downstream work

A bounded representative sample using TCGdex, Scryfall and YGOPRODeck awaits the user's source decision. Production ingestion remains unapproved. One Piece requires an appropriate source; Riftbound requires Riot-authorized assets. Asset publication/optimization/cache headers and live visual acceptance follow that decision.

Cart, promotions, shipping, Smart Cart, simulated checkout, orders, fee allocation, credit/rewards, fulfillment, commerce analytics and concurrency audits are authorized downstream work, **not implemented or tested in this phase**. No Smart Cart savings numbers, cheap-card checkout economics or fee-allocation results are claimed. Real payments remain disabled.

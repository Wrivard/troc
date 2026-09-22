# TROC implementation status

Milestones 1 and 2 are approved. **Stop before Milestone 3.** The approved style guide
is locked. Implementation and activation statuses are distinguished below.

| Milestone | Status | Scope |
|---|---|---|
| 0 — Approved style guide | implemented | Source/tokens/components preserved; visual regression matches |
| 1 — Foundation | implemented | Code/local regression coverage; hosted activation remains blocked |
| 2 — Catalog + Public Marketplace | partial | Browsing/import/search/SEO implemented and audited; production data/hosted integrations blocked; limited presentation features deferred below |
| 2.5 — Marketplace polish | in progress | Home-logo navigation, image schema/resolver/gallery and price/footer polish implemented; representative live artwork awaits provider approval |
| 3 — Low-Value Commerce | deferred | Not started; requires explicit approval |
| 4 — Seller Platform | deferred | Not started |
| 5 — Collector + Trust | deferred | Not started |
| 6 — Admin + Demo + Leads + Future | deferred | Not started |

## Foundation

| Feature | Status | Evidence / limits |
|---|---|---|
| Approved design system and themes | implemented | Direct package imports; eight pixel-identical guide comparisons |
| Domain boundaries and provider interfaces | implemented | Auth/users/sellers/catalog/pricing/search/storage/demo; Catalog, Pricing, Payment, Shipping, Search, Email, Storage, Fx interfaces |
| PostgreSQL/Supabase architecture | implemented | Reproducible SQL migrations, checksum/lock runner, restricted backend role |
| Core relational schema | implemented | Canonical catalog, listings, parent/child orders, integer CAD cents, UTC timestamps, audit and demo provenance |
| Buyer authentication and preferences | implemented | Supabase PKCE adapter, verified server identity, account preference endpoints |
| Authorization | implemented | Buyer ownership; seller owner/member roles; admin/support/catalog moderator; negative regression tests |
| EN/FR and theme persistence | implemented | Paired messages, existing preference provider, account persistence API |
| Demo versus leads | implemented | Tagged fictional fixtures and immutable provenance; real leads separate and protected |
| Hosted account/database verification | blocked | Connected Supabase has no TROC schema; credentials/runtime role/email redirects not activated |

## Catalog and public marketplace

| Feature | Status | Evidence / limits |
|---|---|---|
| Catalog hierarchy and provider mapping | implemented | Game → Set → Product → Printing → Variant → Listing; TROC-owned UUIDs |
| Import adapter and logs | implemented | Approval gates, mappings, aliases, image provenance, bounded batches, row failures, idempotent reruns |
| Provider-wide completeness/jobs | partial | Run counts available; expected-total reconciliation/resumption awaits provider contract |
| Search | implemented | Canonical deduplication, filters on matching offers, keyset pagination, trigram/alias search |
| Public routes | implemented | /, /search, /games/[slug], /sets/[slug], /product/[slug], /store/[slug] |
| Offers and references | implemented | Pageable/sortable exact variants, seller minimum context, condition/grade-specific history, FX metadata, safe integer conversion |
| Graded/photo display | partial | Item company/certificate and configured storage URLs supported; bucket inactive; separate price-provider grading-company dimension pending |
| SEO and SSR | implemented | Metadata/hreflang, sitemap index, demo noindex, root route precedes filesystem |
| Store Deals | implemented | Server-side under-$1 filtering |
| Follows/reviews/activity/collector actions | deferred | Honest empty/unavailable states; assigned to later milestones |
| Licensed production catalog/prices/art | blocked | No source approved; no scraping or production ingestion |
| Vercel deployment | implemented | Frozen-install repair c9c7d18 confirmed Ready before audit; see deployment/audit docs |
| Supabase platform helper permissions | implemented | Migration 0004; anon/authenticated EXECUTE revoked; advisor clear |
| Sentry issues | blocked | Connected organization has no projects; does not block local completion |

## Verification and remaining work

Use pinned **pnpm 10.34.5** (`corepack pnpm` if global pnpm differs). Both frozen install
modes were tested from separate clean dependency states. Typecheck, lint, domain/SQL
tests, full workspace production build and Vercel build are required before each push.
Browser evidence covers 96 public route/viewport/locale/theme combinations plus
keyboard/loading/error interactions and the original eight style-guide comparisons.

See docs/DEPLOYMENT_REPAIR.md, docs/MILESTONE_2_AUDIT.md, docs/CATALOG_SETUP.md and
docs/VERCEL.md for evidence, activation steps and precise limitations. Remaining
performance work includes chart chunk splitting and deep-offer keyset pagination;
selector lists are bounded. No real payments, KYC, shipping integration, Smart Cart,
checkout, seller dashboard or third-party public API was added.

Final audit verification: both clean frozen installs, typecheck, lint, **46 tests**,
full workspace production build, Vercel build, bundled serverless and bilingual SSR
smoke checks all pass. **96 browser cases**, zero detected axe A/AA violations or
uncaught page errors, plus eight pixel-identical guide comparisons.

## Milestone 2.5 — polish (in progress)

- Implemented: top-left logos return to the homepage from marketplace, account and integrated style-guide pages, retaining EN/FR preference. No token/layout redesign.
- Implemented: canonical product/variant image arrays, front/back/detail, responsive rendition dimensions and provider provenance; migration 0005_catalog_images with backend-only reads and no public writes. Not applied to hosted Supabase.
- Implemented: batched PostgreSQL asset adapter reads approved sources; revoked approval removes artwork including stale legacy image URLs. Maximum 48 products per read and 12 image positions per product/variant.
- Implemented: existing CardImage accepts srcSet/sizes, intrinsic dimensions, eager product-detail delivery, lazy grids, loading skeleton and stable failure fallback. Product detail supports simple image selection and full view. New states are documented in the approved component family.
- Implemented: approved LowestAvailable/ReferencePrice hierarchy and Canadian footer/brand copy. Existing marketplace, sellers, sets, activity and prelaunch previews retained.
- Blocked: 30–100 representative real products per game. Awaiting explicit demo approval for TCGdex, Scryfall and YGOPRODeck; the existing artwork references were limited to style-guide illustration. No new provider data/assets were imported. One Piece requires an appropriate approved source. Riftbound remains fallback-only without Riot-authorized API access.
- Not started: sample asset acquisition/optimization/cache publication and live-image deployment checks; these depend on the source decision. No production ingestion, payments, checkout or Milestone 3 work.
- Validation: 48 domain/database tests pass; full typecheck and production build pass. Playwright passed 72 locally injected reference-image route cases (six routes, 390/768/1280 px, EN/FR, dark/light), image selection/failure states and homepage navigation. This is explicitly browser-test imagery, not a populated live catalog.

See docs/CATALOG_IMAGES.md for asset contracts, approval boundaries and remaining work.

Additional polish validation: lint passed; 96 public-route accessibility/responsive checks passed; eight standalone/integrated guide comparisons remain pixel-identical.

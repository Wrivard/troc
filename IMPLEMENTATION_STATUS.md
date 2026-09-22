# TROC implementation status

Milestone boundary: **Milestone 2 approved and implemented. Stop before Milestone 3.**
The user has approved the complete `/style-guide`; prior partial-approval notes are historical.

| Milestone | Status | Scope |
|---|---|---|
| 0 — Approved style guide | implemented | Preserved source, assets, tokens and component catalog |
| 1 — Foundation | implemented | Code and local verification; external integration activation blocked below |
| 2 — Catalog + Public Marketplace | implemented | Local demo and PostgreSQL adapter verified; licensed production activation blocked |
| 3 — Low-Value Commerce | not started | No cart, Smart Cart, checkout or payments |
| 4 — Seller Platform | not started | No approval UI, dashboard or inventory workflows |
| 5 — Collector + Trust | not started | No collections, messaging or review workflows |
| 6 — Admin + Demo + Leads + Future | not started | No admin UI, production seed/purge or lead forms |

## Foundation features

| Feature | Status | Evidence / limits |
|---|---|---|
| Approved UI reuse | implemented | Direct package imports; original guide exported intact |
| Domain boundaries | implemented | Auth, users, sellers, providers, shared, demo modules; SQL ownership and later module map documented |
| PostgreSQL/Supabase architecture | implemented | SQL migrations, checksum/lock runner, Supabase SSR adapter, restricted backend role |
| Core entity schema | implemented | Identity, sellers, canonical catalog, listings/inventory, price/FX provenance, parent/child orders, audit, demo batches and separate leads |
| Buyer authentication/account | implemented | Sign-up, PKCE confirmation, sign-in/out, verified protected account and preferences API; activation requires Supabase |
| Server authorization | implemented | Buyer ownership, seller owner/manager/inventory/fulfillment/customer service, admin, support, catalog moderator |
| Seller application foundation | implemented | Adult/Canada validation, transactional submission, open-application uniqueness, audit; full application/approval workflow M4 |
| EN/FR | implemented | Typed paired copy, API error codes, original preference persistence and account defaults |
| Theme persistence | implemented | Original provider unchanged, account persistence endpoint |
| Provider interfaces | implemented | CatalogProvider, PricingProvider, PaymentProvider, ShippingProvider, SearchProvider, EmailProvider, StorageProvider, FxProvider |
| Demo provenance foundation | implemented | Repeatable batch keys, automatic immutable provenance, explicit protected-table boundaries; no purge endpoint |
| Tests | implemented | Domain, HTTP, PostgreSQL constraints and database privileges; browser regression script |
| Live Supabase auth/database verification | blocked | No project credentials, runtime role or email-delivery setup supplied |
| Production catalog license | blocked | No production source approved; only authored fictional fixtures are available |

## Verification

- `pnpm typecheck`: passed across the workspace.
- `pnpm lint`: passed for foundation and marketplace code/tests.
- `pnpm test`: 36 passing tests, including executable migrations and restricted-role assertions.
- Marketplace, approved guide and API production builds: passed.
- Browser checks: 8 combinations (390/1280 px × EN/FR × dark/light), no overflow or
  uncaught errors, persistent locale/theme after reload. Standalone/integrated guide
  overview screenshots are pixel-identical in all 8 combinations.
- Account/mobile and guide screenshots visually inspected. Browser evidence is in
  `verification/browser-results.json`; PNGs are local verification artifacts.
- No remote migration, email delivery or real hosted authentication was claimed tested.

## Remaining activation / later work

1. Provision the intended Supabase project, apply migrations with separate owner
   credentials, create a runtime LOGIN inheriting `troc_backend`, and configure
   confirmation email/PKCE redirects. Run hosted sign-up, refresh and sign-out smoke tests.
2. Configure a same-origin deployment/reverse proxy and a shared rate limiter before
   running multiple API instances. GitHub is configured for Vercel; no live Vercel URL has been supplied or verified.
3. Licensed production provider adapters, seller approval/Founding Seller allocation,
   complete commerce ledgers/rules, demo purge, and other product screens remain in
   their assigned later milestones. Schema support does not imply workflow completion.
4. The existing API build dependency reports a pre-existing esbuild-plugin-pino peer
   version warning; its production build passes. No design source was changed for it.

No real catalog, scraping, real payments, KYC, shipping integration or third-party public API was added.
See `docs/FOUNDATION_SETUP.md` for reproducible commands and configuration requirements.

## Milestone 2 features

| Feature | Status | Evidence / limits |
|---|---|---|
| Canonical catalog/import | implemented | Migration 0003; provider mappings, license gates, bounded batches, idempotency, row failures and audit; only fictional adapter enabled |
| Search | implemented | PostgreSQL trigram search, canonical deduplication, keyset pagination, same-offer filters and integer-cent aggregates |
| Public routes | implemented | Home, search, game, set, product and seller store; approved components, EN/FR and theme preferences |
| Product offers/prices | implemented | Exact language/variant, lowest/median/reference, seller minimums, price history and FX provenance; best 50 offers and 90 history samples |
| SEO | implemented | Server-rendered HTML, canonical/hreflang, paged sitemap index; demo/search pages noindex |
| Vercel configuration | implemented | Single project, bundled SSR renderer, API rewrites, explicit review-only demo mode |
| Production catalog/pricing/images | blocked | Requires explicit data-source and image licensing approval and provider credentials |
| Hosted deployment verification | blocked | User will connect GitHub to Vercel; actual deployment URL not yet available |

Milestone 2 validation: 48 public-route browser checks (six routes × two viewport
widths × two languages × two themes), interactive filters and variant navigation,
plus bilingual SSR metadata/status/indexing checks. Original guide comparison remains
pixel-identical in all eight combinations. Evidence: verification/marketplace-browser-results.json
and verification/ssr-results.json. Client and SSR marketplace builds and API build pass.

Intentional limits: purchasing, saved searches, wishlist matching, follows and reviews
remain unavailable until their assigned milestones. No fake reviews or real artworks
were generated. Store deals currently filter the displayed result page; catalog metadata
selectors are bounded (50 games, 100 sets, 24 sellers). Large-catalog selector search and
further offer pagination remain TODOs. Vite reports a 639 kB main client chunk; splitting
the price-chart dependencies is a performance follow-up, not a failed build.

See docs/CATALOG_SETUP.md for import operation and recovery limits.

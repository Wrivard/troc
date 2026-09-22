# TROC implementation status

Milestones 1 and 2 are approved. **Stop before Milestone 3.** The approved style guide
is locked. Implementation and activation statuses are distinguished below.

| Milestone | Status | Scope |
|---|---|---|
| 0 — Approved style guide | implemented | Source/tokens/components preserved; visual regression matches |
| 1 — Foundation | implemented | Code/local regression coverage; hosted activation remains blocked |
| 2 — Catalog + Public Marketplace | partial | Browsing/import/search/SEO implemented and audited; production data/hosted integrations blocked; limited presentation features deferred below |
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

# TROC implementation status

## Current release hold — 2026-09-22

Bounded seller Milestone 4 is locally integrated for reciprocal review; no release or production migration. Independent review, combined stress/recovery and all readiness gates are mandatory before B/C release or a next milestone. Hosted auth/database and representative PostgreSQL load validation remain BLOCKED. See docs/COORDINATION.md and MEMORY.md. Historical deployment evidence below concerns only earlier releases.

## Milestone 3.5 — seller inventory, 2026-09-22

Status: **In development** for hosted activation; local implementation and audit complete. This task's implementation scope ends at 3.5. The user has separately authorized bounded Milestone 4 seller work and early Milestone 6.5 prelaunch work; see docs/COORDINATION.md. Those tracks are not yet integrated or claimed complete.

- Added source/external identifiers, versioned stock edits, canonical-only manual listings, generic CSV mapping/preview/publish, seller inventory search/filters/bulk actions and durable inventory state events.
- Preserved canonical catalog/listing separation and all existing commerce flows. Existing inventory identifiers are unchanged.
- Combined validation after merging design code `9f4f58e` and evidence `e236c29`: 70 tests pass, including 100/1,000/10,001-row imports and prior commerce regressions; 13 inventory browser cases, type checking, lint, full production builds and bundled SSR smoke checks pass. Release `e8b8b92` deployed successfully on Vercel; 20 live checks passed with inventory correctly unavailable until hosted activation. See [the audit](docs/MILESTONE_3_5_AUDIT.md).
- Hosted activation still requires the existing Supabase/database configuration plus migration 0008. Source names do not imply live integrations. Graded-card creation and real integration delivery remain outside this bounded workflow.
- Master roadmap: [docs/product/roadmap.md](docs/product/roadmap.md). Internal docs: [docs/README.md](docs/README.md).

Milestones 1–3 are complete for sequencing. Earlier gate statements in historical
sections below are superseded by the current scope and coordination record.
Implementation and activation statuses are distinguished below.

| Milestone | Status | Scope |
|---|---|---|
| 0 — Approved style guide | implemented | Source/tokens/components preserved; visual regression matches |
| 1 — Foundation | implemented | Code/local regression coverage; hosted activation remains blocked |
| 2 — Catalog + Public Marketplace | partial | Browsing/import/search/SEO implemented and audited; production data/hosted integrations blocked; limited presentation features deferred below |
| 2.5 — Marketplace polish | implemented | Approved bounded sample: 159 products, 324 local responsive renditions; real-art/browser audit passed; production catalog remains unapproved |
| 3 — Low-Value Commerce | implemented locally; hosted activation blocked | Cart, Smart Cart, simulated checkout/fulfillment, ledgers and audit implemented; hosted credentials/schema remain unavailable |
| 3.5 — Seller Inventory | implemented/audited; application deployed; hosted activation blocked | Versioned inventory, raw-single listings, reviewed CSV import and events; 20 live page checks passed |
| Design / UX / brand polish | implemented | Bilingual marketplace composition, shared navigation/footer, existing commerce polish, explicit roadmap states; no new product milestone |
| 4 — Seller Platform | In development; locally integrated for review | Bounded application/manual approval/team/dashboard scope; release held; broader milestone remains planned |
| 4.5 — Seller API + Live Sync | Planned | Credentials, signed delivery/retries and live synchronization |
| 5 — Collector + Trust | deferred | Not started |
| 5.5 — Founding Seller + Referrals | Planned | Qualified contribution and configurable benefits |
| 6 — Admin + Demo + Leads + Future | deferred | Not started |
| 6.5 — Prelaunch Growth | In development in separate worktree | Isolated waitlists/private leads/consent/cohorts; not integrated |
| 7.5 — Wishlist + Demand | Planned | Demand matching and privacy-safe alerts |
| 8.5 — Smart Cart Expansion | Planned | Extend the existing Milestone 3 optimizer |
| 9.5 — Canadian Market Data | Planned | Legitimate transaction-derived data |
| 10.5 — Collection Flywheel | Planned | Collection-to-sell and wishlist-to-buy |

## Major design refinement — 2026-09-22

- Implemented: Pokémon-led showroom hero, illustrated game tiles, editorial discovery and affordable-card grids, shipping-savings comparison, Canadian story, store profiles, final CTA and richer footer.
- Implemented: shared editorial intros/panels/icons/catalog grid and an opt-in showroom presentation documented in the guide. Approved logo, typography and palette preserved.
- Implemented: grouped search refinements, product art/price/offer hierarchy, store catalog-art banners, chaptered information pages and honest planned collection presentation. EN/FR and theme preferences preserved.
- Verified locally: type checking, lint, 59 domain tests, workspace and Vercel production builds; 400 responsive route checks, 96 art checks, 12 full commerce flows, 12 large-cart cases, 8 guide-parity cases and 8 focused motion/guide checks. Grouped-filter regression, 20 live route checks and three live cart/Smart Cart cases passed; evidence is tracked in [the refinement report](docs/WORLD_CLASS_DESIGN_REFINEMENT.md).
- Hosted deployment: Vercel success for implementation commit `1d14f16`; live URL verified. No Milestone 4 implementation and no real payment/catalog-license expansion.

## Dedicated design / UX / brand polish — 2026-09-22

- Implemented: card-led homepage, shared marketplace header/footer, compact mobile navigation, discovery/product/storefront/account/commerce presentation refinements, bilingual about/help/condition/seller/developer information pages.
- Implemented: clearly labeled planned-state pages for requested but unbuilt collector/account/seller routes; these are not functional feature implementations. Milestones 4–6 remain not started.
- Preserved: approved tokens/logo/themes, catalog provider approvals, domain rules, authorization, integer-cent pricing and simulation boundaries.
- Added to existing style-guide families: static CardShowcase and opt-in compactMobile navigation; corrected seller-banner overlap.
- Verification: 400 responsive route checks, 12 authenticated local commerce flows, 12 large-cart cases, 96 real-art cases, 59 domain tests, eight guide comparisons and successful Vercel production build; results recorded in docs/DESIGN_POLISH_AUDIT.md.
- Deployment: implementation commit 7981f5f pushed to main; Vercel deployment CttAZkqpPmnA9iaCwzDo41EH5VAX succeeded. Actual public URL passed 20 responsive route checks plus three cart/Smart Cart flows; server-rendered hero/artwork and deferred chart loading verified.
- Hosted authenticated checkout remains blocked on the existing activation requirements in docs/COMMERCE_SETUP.md.

## Milestone 3 — current implementation, 2026-09-22

- Implemented: `/cart`, `/smart-cart`, `/checkout`, `/account/orders[/id]`, `/seller/orders[/id]`; approved components/tokens, EN/FR, persistent theme, mobile grouping and pagination.
- Implemented: integer-cent seller minimums, best-rule promotions, non-stacking sale prices, aggregate Canadian simulation shipping, level-gated free shipping, bounded landed-cost optimization and exact-identity locks.
- Implemented: PostgreSQL carts, immutable order snapshots, reservations, idempotent simulated payment, one fixed processing fee with exact allocation, append-only credit/reward/refund ledgers, order messages and notification outbox.
- Implemented: buyer/seller ownership checks, dedicated refund permission, restricted backend-role integration tests, expired-checkout credit recovery, stock reduction once, cancellation restock once, bounded order-history cursors.
- Implemented: explicit operator-only bounded demo seed preserving canonical IDs, approved asset provenance and existing inventory on reruns. No runtime seeding, mock production auth, real payment or production catalog import.
- Implemented: demo-tagged server commerce events plus bounded, retryable, deduplicated anonymous browser metrics. Browser metrics are marked separately from authoritative checkout events.
- Verification: 59 tests, restricted-role SQL scenarios, 12 full commerce browser flows, 12 large-cart viewport cases (5/20/50/100 lines), eight identical standalone/integrated style-guide comparisons. Final build/deployment evidence is recorded in `docs/MILESTONE_3_AUDIT.md`.
- Blocked: hosted account/checkout activation. Vercel has no Supabase/database variables; connected Supabase has no TROC schema. Follow `docs/COMMERCE_SETUP.md`. This is not claimed as a hosted authenticated checkout pass.
- Deferred by scope: real payment/tax/carrier integrations, full seller platform, wishlist/master-set matching, reviews and real notification delivery. Stop before Milestone 4.

See `docs/MILESTONE_3_AUDIT.md` for calculation results, review fixes and limitations. Sections below retain earlier milestone evidence; historical gate statements are superseded by the approved sample completion and this current section.

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

## Historical Milestone 2.5 polish record — superseded by approved sample completion

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

## Phase A audit — Milestone 2.5

Historical gate: **was blocked**, now resolved by the approved sample completion below. At this audit point, the demo had 15 fictional products and awaited source approval; commerce had not started.

Fixed after reviewing 900fd18...016dfc7:
- Responsive image manifests now pass through the authorized, transactional importer into canonical images/renditions. IDs survive reruns/reordering; rejected imports retain prior data. Explicit imageScopes permit safe product/variant removal; a second language cannot erase shared product art.
- Migration 0006 validates image/product/variant/provenance relationships and prevents rebinding referenced provenance. The read adapter also rejects mismatches. It preserves live-approved legacy imports while never trusting cached imageUrl.
- Rendition input permits first-party /catalog-art paths or explicitly configured CDN origins; there is no server-side arbitrary-URL fetch. Image-count/rendition-count/dimension/identity validation is bounded.
- Batched image assembly now uses indexed maps instead of repeatedly scanning every image per variant.
- CardImage handles cached completion when clearing its loading skeleton. Component family records document the added contracts.
- New SQL integration tests cover manifest lifecycle, source revocation, provenance mismatch and cross-language shared-image retention. Browser fixtures prove responsive selection, loading stability, sealed containment and variant changes in 12 viewport/locale/theme combinations. These synthetic tests do not replace real-art verification.

Supabase MCP: public/troc contain no application tables; security/performance advisors return no findings. Sentry has no configured project. No hosted migrations or credentials were changed. See docs/MILESTONE_2_5_AUDIT.md.

## Approved sample completion — 2026-09-22

The earlier demo-source blocker is resolved by explicit user approval (attachment 106718b8-c4a0-4d99-bff8-4df3c8a3c394). Imported 50 Pokémon/TCGdex, 50 Magic/Scryfall and 59 Yu-Gi-Oh!/YGOPRODeck products as a bounded demo snapshot. All 324 full-card renditions are rehosted; URLs are content-addressed with immutable cache headers. Canonical UUIDs, mappings, languages, sets, numbers and asset provenance are retained. No provider calls occur in the UI/runtime.

Actual art passed 96 Playwright cases over eight routes, three widths, EN/FR and dark/light. File-level tests verify every rendition's actual width and aspect ratio. Seller-card mobile spacing was corrected in the reusable style-guide component without changing visual tokens. Both frozen installs, 51 tests, typecheck, lint, production build and Vercel build pass. One Piece/Riftbound retain permitted fallbacks; selected providers do not cleanly supply sealed samples, so those remain fictional fixtures. No production catalog, real pricing feed or payment integration is approved.

See docs/DEMO_CATALOG_APPROVAL.md and verification/real-art-browser.json. Earlier Phase A blockers below/above are historical; this approval supersedes the representative-demo artwork blocker only.

## Design quality pass — 2026-09-22

Status: **implemented and live verified**. Code release `9f4f58e` is deployed on the production Vercel URL. See [DESIGN_QUALITY_REVIEW.md](DESIGN_QUALITY_REVIEW.md) for critical route review, iterations and evidence.

Implemented: shared depth-aware card stack; whole-card marketplace links; larger game destinations; realistic labelled how-it-works examples; Smart Cart price/shipping comparison; seller previews; compact game heroes; sticky product decisions and compact reference history; unclipped storefront identity; seller/binder/auth/empty-state compositions; desktop/mobile filter hierarchy. Original logo, palette, type, Canadian story and footer preserved. EN/FR and theme preference retained. No new marketplace milestone business scope.

Remaining: approved artwork for two game destinations; real seller branding/content; hosted authenticated commerce activation; planned collection/follow/notification features. Milestone 3.5 is developed separately and is not marked complete by this design pass.

Release gate: 59 domain tests, typecheck, lint, full workspace build, Vercel build, 400 responsive route cases, 96 artwork cases, 12 local commerce flows, 8 motion/guide cases and 8 preference/guide-parity combinations passed. Touch, avatar bounds, keyboard card navigation and mobile heading order also passed. Production verification: 40 route cases plus 3 guest cart/Smart Cart cases passed; hosted authenticated checkout remains explicitly unavailable. See `verification/design-quality-live.json` and `DESIGN_QUALITY_REVIEW.md`.


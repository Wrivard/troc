# TROC implementation status

Milestone boundary: **Milestone 1 only. Stop before Milestone 2.**
The user has approved the complete `/style-guide`; prior partial-approval notes are historical.

| Milestone | Status | Scope |
|---|---|---|
| 0 — Approved style guide | implemented | Preserved source, assets, tokens and component catalog |
| 1 — Foundation | implemented | Code and local verification; external integration activation blocked below |
| 2 — Catalog + Public Marketplace | not started | Requires user approval |
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
| Production catalog license | blocked | No source approved; intentionally no ingestion in M1 |

## Verification

- `pnpm typecheck`: passed across the workspace.
- `pnpm lint`: passed for foundation code/tests.
- `pnpm test`: 24 passing tests, including executable migrations and restricted-role assertions.
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
   running multiple API instances. Nothing was deployed or published.
3. Full provider adapters, ingestion, seller approval/Founding Seller allocation,
   complete commerce ledgers/rules, demo purge, and other product screens remain in
   their assigned later milestones. Schema support does not imply workflow completion.
4. The existing API build dependency reports a pre-existing esbuild-plugin-pino peer
   version warning; its production build passes. No design source was changed for it.

No real catalog, scraping, real payments, KYC, shipping integration or public API was added.
See `docs/FOUNDATION_SETUP.md` for reproducible commands and configuration requirements.

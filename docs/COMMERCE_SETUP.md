# Milestone 3 activation

The public demo supports device-local carts and server-calculated Smart Cart without account configuration. Checkout always requires a verified Supabase buyer and persistent PostgreSQL; it never falls back to a demo identity.

## Hosted prerequisites

1. Apply numbered SQL migrations 0001–0007 with an operator connection using `corepack pnpm --filter @workspace/db migrate` (see the database package scripts). Do not use the migration owner as the HTTP runtime login.
2. Create a dedicated PostgreSQL LOGIN and grant membership in `troc_backend` with inherited privileges. Keep its credentials only in Vercel's secret environment settings.
3. Set `DATABASE_URL` to that dedicated runtime connection, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `APP_ORIGIN=https://troc-api-server-psi.vercel.app`, and `PUBLIC_SITE_URL` to the same public origin. Configure Supabase email/PKCE redirects for `/api/auth/callback` on that origin. Keep `CATALOG_MODE=demo` until a production catalog is explicitly approved.
4. With the **operator** connection and `CATALOG_MODE=demo`, run `corepack pnpm commerce:seed-demo`. This writes only the already approved bounded snapshot and fictional listings. It does not create users, memberships or auth credentials. Re-running preserves stock and existing source revocations. Never run this command in an HTTP handler.
5. Sign up a real test buyer through Supabase. Grant test seller membership explicitly to an authorized test account through an operator workflow; never accept a seller ID/role from a browser as identity. Re-deploy and repeat the authenticated browser flow.

No credentials are committed. At the 2026-09-22 audit, the connected Supabase project had no TROC tables and Vercel had only the Corepack environment setting. Hosted authentication/checkout activation therefore remains blocked.

## Local verification

`corepack pnpm test` runs domain rules and PostgreSQL integration using PGlite, including transactions under `SET LOCAL ROLE troc_backend`. PGlite serializes transactions; native multi-connection PostgreSQL load testing remains an activation check, not a claimed benchmark.

`corepack pnpm exec tsx tests/commerce-server.ts` starts an isolated in-memory PostgreSQL test harness bound to `127.0.0.1:3002`. It seeds the approved snapshot twice, proving reruns do not fail. It injects test identities **only in this test entry point**, which is not imported or deployed. Start marketplace Vite on port 5175 with `API_ORIGIN=http://127.0.0.1:3002`, then run `node tests/commerce-browser.mjs` and `node tests/commerce-large-browser.mjs`.

## Deliberate simulation policies

- CAD integer cents throughout. Config lives in `modules/commerce/config.ts`; shipping and tax values are illustrative development estimates, not carrier quotes or production tax advice.
- Seller minimum uses pre-promotion merchandise. Exactly one highest-value eligible basket promotion/coupon wins. Sale-priced lines are excluded from basket discounts. Free shipping uses discounted merchandise and eligible seller levels.
- One payment covers the buyer checkout. Processing percentage plus one fixed fee is proportionally allocated by largest remainder. Zero externally paid total incurs no simulated processing fee.
- Quotes reserve nothing. Preparation locks inventory in stable order, persists a 15-minute reservation and consumes requested credit. Success commits inventory once. Decline/cancel releases reservations and credit. Expired sessions reconcile automatically when the buyer opens their cart or prepares another checkout; pending sessions also have an authenticated cancel endpoint.
- Rewards use configurable eligibility and the highest applicable amount. They post after all seller orders complete. Later refunds reverse earned rewards using appended ledger entries. Refunds are simulated credit only; physical returns are not assumed. Only never-shipped cancellation restocks inventory.
- Fee ledger entries remain immutable historical charges. Seller UI explicitly labels the original net **before refunds** and shows refunded credit separately. Real processor refund/fee-reversal policy is deferred until a processor is selected.
- Notification outbox records confirmation intent. No real email is sent. Order messages are participant-scoped and stored separately.
- Smart Cart is deterministic and bounded (eight candidates/request, beam 24, maximum 2,500 evaluations). It considers whole-seller consolidation before beam search. It is not a proof of global optimality. Exact graded/photo/special listings are never substituted automatically.

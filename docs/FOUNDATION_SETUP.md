# Foundation setup and verification

## Local / Replit development

Use Node 24 and pnpm (tested with pnpm 9.15). Run `pnpm install --no-frozen-lockfile`
after changing manifests; CI should use the committed lockfile. The existing dependency
release-age policy remains. Native Windows x64 packages are now permitted alongside Linux.

1. API process: set `PORT=3001`, `APP_ORIGIN=http://localhost:5173`, and the credentials
   shown in `.env.example`; run `pnpm dev:api`.
2. Web process: set `PORT=5173`, `BASE_PATH=/`, `API_ORIGIN=http://127.0.0.1:3001`;
   run `pnpm dev:marketplace`. Vite proxies `/api` to Express on the same browser origin.
3. Open `/style-guide`, `/sign-in`, `/sign-up`, `/account` or `/account/settings`.
   `/` intentionally goes to the approved guide until the marketplace milestone.
4. For standalone guide comparison, use `PORT=5174 BASE_PATH=/` with
   `pnpm --filter @workspace/troc-design-system dev` (set variables using your shell).

No configured credentials: the UI/guide run, and account endpoints return a translated
service-unavailable state. This is not demo authentication. `.env.example` is documentation;
load environment variables via Replit Secrets or the shell, not a client bundle.

## Supabase provisioning (external configuration needed)

1. Create/select the intended Supabase project. Do not connect a production catalog.
2. With migration-owner `DATABASE_URL`, run `pnpm --filter @workspace/db migrate`.
   Use a direct/session database connection for migrations and keep owner credentials
   separate from the HTTP runtime. No migration has been applied to a remote database here.
3. Create a dedicated database LOGIN through your credential manager and grant it
   membership in `troc_backend` with inheritance. It must not own the schema/tables,
   have BYPASSRLS, CREATEROLE, or migration-owner membership. Put its connection URL
   into the API's `DATABASE_URL`; use verified TLS outside local development.
4. Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and the exact public `APP_ORIGIN`.
   No service-role key is needed. Turn on email confirmation, configure SMTP delivery,
   and allow `${APP_ORIGIN}/api/auth/callback` as an auth redirect.
5. Complete sign-up and email confirmation in the same browser (PKCE), then sign in.
   Check account preferences, refresh and sign-out. Confirm a second buyer cannot
   access the first account, and suspend a test buyer to verify denial.
6. Bootstrap the first administrator with an audited operator SQL transaction after
   their application user exists. There is deliberately no public bootstrap endpoint.

Deploy frontend assets and `/api` under a single origin. Retain the original Replit
style-guide workflow while adding the marketplace/API processes above. Production
reverse-proxy/static-host routing must send account paths to the SPA and API paths
to Express. No deployment was requested or performed in this milestone.

## Checks

- `pnpm typecheck` checks all existing packages plus the marketplace.
- `pnpm lint` checks foundation TypeScript and tests, leaving approved guide source untouched.
- `pnpm test` runs domain, HTTP and executable PostgreSQL migration/constraint tests (PGlite).
- `pnpm test:browser` expects web 5173, standalone guide 5174, API 3001 and installed Edge.
  It checks both locales/themes at mobile/desktop sizes, persistence, overflow and
  pixel equality between standalone and integrated guide. Evidence is in `verification/`.
- `pnpm --filter @workspace/marketplace build` and the existing guide/API build scripts.

PGlite validates SQL and permissions but does not replace a configured Supabase
integration test for live email delivery, cookies, rotation and remote role provisioning.

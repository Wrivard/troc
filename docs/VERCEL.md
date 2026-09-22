# Vercel deployment

Import `Wrivard/troc`, branch `main`, with the **repository root** as Root Directory.
The root `vercel.json` supplies installation, frontend build, output and API routing.
Use Node 24 and the pinned pnpm 10.34.5 via Corepack. No separate frontend/API Vercel projects are needed.

The approved `/style-guide` and account routes can render without credentials.
Account authentication requires the server variables from `.env.example`:
`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `APP_ORIGIN`.
Set `APP_ORIGIN` to the final HTTPS site origin and register its auth callback in
Supabase. Never use migration-owner credentials as the runtime database connection.

Vercel runs the existing Express app through `api/index.js`. Database provisioning
is a separate operator step; builds never run migrations or seed a production database.

Deployment repair c9c7d18 was confirmed Ready on the existing project before the
Milestone 2 audit. Product SSR was verified with authenticated Vercel CLI access.
Deployment Protection remains enabled; visitors may be redirected to Vercel sign-in.

Public marketplace routes render on the server through the same Express entry. The
build includes both client assets and the standalone SSR renderer. The committed
CATALOG_MODE=demo setting deliberately shows authored fictional fixtures and disables
search indexing; no database is needed for this review mode. Do not treat this as a
production catalog. After licensing and database activation, change the committed
setting to postgres and configure the runtime database.

Set PUBLIC_SITE_URL to the canonical HTTPS origin; absent an explicit value, the
server uses Vercel's production/project URL. APP_ORIGIN must match the account origin.
Check /, /style-guide, /product/pokemon-northern-spark?lang=fr and /robots.txt after
connecting Vercel. Domain/database integration is not exercised by the frontend build.

Do not set Root Directory to artifacts/api-server. The existing project was corrected
to repository root with the Vite preset. Clear dashboard install/build/output overrides;
use the committed vercel.json. See DEPLOYMENT_REPAIR.md for the frozen-install repair.

Set ENABLE_EXPERIMENTAL_COREPACK=1 in Vercel environments so function tracing also
uses pinned pnpm. This setting is enabled on the existing project.

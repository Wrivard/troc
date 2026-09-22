# Vercel deployment

Import `Wrivard/troc`, branch `main`, with the **repository root** as Root Directory.
The root `vercel.json` supplies installation, frontend build, output and API routing.
Use Node 24. No separate frontend/API Vercel projects are needed.

The approved `/style-guide` and account routes can render without credentials.
Account authentication requires the server variables from `.env.example`:
`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `APP_ORIGIN`.
Set `APP_ORIGIN` to the final HTTPS site origin and register its auth callback in
Supabase. Never use migration-owner credentials as the runtime database connection.

Vercel runs the existing Express app through `api/index.ts`. Database provisioning
is a separate operator step; builds never run migrations or seed a production database.

This configuration has not yet been deployed to or verified on a live Vercel URL.

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

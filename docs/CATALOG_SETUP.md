# Catalog operation (Milestone 2)

`lib/catalog` contains shared contracts; API catalog, search and pricing modules own
services/adapters. The marketplace imports the approved design system directly.
Migration `0003_catalog.sql` adds import/license records, canonical source mappings,
search projections, public seller profiles and reference-price demo provenance.

Local review uses `CATALOG_MODE=demo`: fifteen authored fictional products across
five games, with small representative single/sealed/graded variants and sellers.
No network catalog request or image download occurs. Card images use the approved
missing-image component. Production uses `CATALOG_MODE=postgres` and fails closed
without database configuration. Web runtime uses the restricted `troc_backend` role.

The offline importer requires a dedicated connected database client, migration/operator
permissions and an active admin/catalog-moderator identity. For fixtures only:
`pnpm catalog:import-demo <unique-run-key>` with DATABASE_URL and IMPORT_ACTOR_ID.
Do not run this against production merely to fill the homepage. The web app has no
import endpoint and cannot modify provider approvals.

Provider licenses and image permissions are separate, operator-controlled database
records with evidence. No production provider adapter is enabled. Canonical IDs are
UUIDs; external IDs only live in mappings. Existing mappings retain their IDs on reruns.
Provider identities are not merged by fuzzy names; explicit canonical mapping review
is needed before adding another source of the same catalog.

A run takes a provider advisory lock, commits bounded pages, isolates rejected rows,
and records cursors/counts/failure codes. It processes at most 50 pages of 200 records.
Reuse of a run key returns its original report. Retry a failed/partial/interrupted run
with a new key; stable source mappings make replay safe. Automatic cursor resumption
and a long-running job queue are future scaling work. Never remove existing source
mappings just to retry a run.

Price references preserve source minor units/currency, provider timestamp, captured
UTC timestamp, FX date/rate and integer CAD cents. Decimal FX conversion uses BigInt
arithmetic. Real provider freshness schedules are blocked on source approval.

Verification commands:
- `pnpm typecheck`, `pnpm lint`, `pnpm test`
- `pnpm --filter @workspace/marketplace build`
- `pnpm --filter @workspace/api-server build`
- `pnpm test:browser` (marketplace 5173 and standalone guide 5174 running)
- `node tests/marketplace-browser.mjs` (marketplace 5173 and demo API 3001 running)
- `node tests/ssr-smoke.mjs` (built marketplace and demo API 3001 running)

The internal page-data route supports the first-party frontend; it is not the future
third-party public API product. Public pages never enable purchasing or follow/save
mutations. A single canonical product result aggregates eligible offers, and all
condition/language/variant/price/seller constraints apply to the same matching offer.

Audit update: offers now use bounded pages (20 default, maximum 50, up to 10,000
pages) with price/quantity sorting; selected condition/grade/provider series controls
reference comparisons. Image imports require an existing approved exact provider/license
record. Listing-photo display requires STORAGE_PUBLIC_BASE_URL; keys remain encoded
under that trusted HTTPS base. This read-only adapter does not add upload workflows.
Run node tests/marketplace-interactions.mjs for keyboard/state/pagination coverage.

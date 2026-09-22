# Milestone 2 audit — 2026-09-21

Deployment was repaired and confirmed Ready before this audit began. Repair commit:
`c9c7d18`; Vercel deployment `dpl_9zhsHgwunvLETavWkmj1z7fcvjQF`; GitHub check success.
The source baseline was the approved-guide commit `c1ac66f`. Standards and product
specification reviews were performed independently; browser checks covered the
current implementation. No Milestone 3 work was started.

## Standards review

Correct: server-verified Supabase identity; server-side global/seller-role boundaries;
parameterized SQL; a restricted runtime role; RLS enabled; immutable audit/demo
provenance; integer-cent CAD money; timestamptz/UTC; canonical UUIDs and provider
mapping tables; replaceable provider interfaces; no client secrets identified.

Fixed:
- PostgreSQL bigint reference money is validated against JavaScript's safe-integer
  range instead of being narrowed to a 32-bit SQL integer.
- Image import requires an existing operator-approved exact provider/license record;
  an incoming provider record can no longer approve its own license.
- Mixed demo listings, sellers and price histories carry demo disclosure/indexing flags.

## Specification review

Fixed:
- Search cards select and link to the matching language/variant/rarity, preserving
  condition, seller and price constraints rather than opening the first variant.
- Reference prices/history retain condition, grade and provider product identity;
  history is one comparable provider/currency series. Raw defaults to NM; graded
  reference comparison requires an explicit grade. Source currency display uses
  currency-specific precision (JPY/CAD/KWD tests).
- Result/product set metadata is fetched even beyond the newest 100 selector entries.
- Seller offers are sortable and pageable (20 default, 50 maximum), with matching
  aggregate/filter behavior and stable tie-breaking. Page size survives navigation.
- Grading company/certificate identifiers are exposed. Approved component-based
  photo display reads an explicitly configured HTTPS public listing-storage base.
- Store Deals queries the server rather than filtering only one previously loaded page.
- Homepage routes run before static-file handling so the deployed root receives SSR.
- Browsable offer information retains normal contrast while purchase controls remain
  disabled; approved guide source, tokens and components were not changed.

## Verification scope

Automated browser coverage: six public routes × four widths (390, 768, 1280, 1920)
× EN/FR × dark/light; WCAG A/AA axe scans, semantic headings, image alternatives,
viewport overflow and uncaught exceptions. Separate interactions cover keyboard
select/Escape/focus, reduced motion, Japanese navigation, offer pagination, loading,
empty and translated error/retry states. No new dialogs or drawers were introduced.
This is automated/manual targeted accessibility coverage, not a formal certification.

The guide remains pixel-identical standalone versus integrated in eight original
mobile/desktop × locale × theme comparisons. Representative mobile FR/light product
and large-desktop EN/dark homepage screenshots were visually inspected.

## Connected services

Supabase project `wcpsyflzqaeorxaejaqh` contains no TROC application tables or initial
application migrations. Hosted buyer/seller/RLS flows therefore remain blocked;
local executable PostgreSQL tests verify the schema and runtime-role behavior.
The security advisor found PUBLIC/anon/authenticated EXECUTE on the platform's
SECURITY DEFINER event-trigger helper public.rls_auto_enable(). Revoked access in a
remote migration and recorded repeatable local migration 0004. Both roles now lack
EXECUTE; security and performance advisor results are empty. No application tables
or user data were provisioned or modified. Sentry organization troc-ho has no projects.

## Partial, blocked and deferred

- Production catalog, reference pricing and artwork: blocked pending explicit
  provider/license approval, approved source contracts and credentials. No scraping.
- Hosted authentication/database and listing-photo bucket activation: blocked on
  provisioning/configuration; public review uses marked fictional fixtures.
- Followers, real feedback, sold activity, collector matches, purchase/promotions,
  shipping calculation and seller-management workflows: deferred to their assigned
  milestones. No fabricated traction or partnerships.
- Import counts/failures are implemented, but provider-wide completeness reconciliation,
  resumable jobs and automated schedules are partial pending a real provider contract.
- Selector searches remain bounded; offer pagination uses offset with a maximum of
  10,000 pages. Deep-page keyset optimization remains a scaling follow-up.
- Graded reference snapshots identify provider/product/grade, but do not yet carry a
  separate grading-company comparison dimension. Provider approval must settle that
  mapping before production graded-price comparisons.
- The roughly 640 kB main client chunk still includes chart dependencies. Splitting it
  is deferred performance work; there are no unbounded client catalog loads or SQL
  queries per search result. History is capped at 90 points; photo URLs at 12 per offer.
- Vercel Deployment Protection remains enabled. Authorized CLI checks can verify
  content; ordinary visitors may see Vercel sign-in until the owner changes protection.

Evidence lives in verification/*-results.json and verification/service-audit.json.

Final local results: 46 tests, typecheck, lint, both clean frozen installations, full
production build, Vercel build, bundled API/SSR smoke checks passed. All 96 public
browser cases passed with zero detected axe A/AA violations and zero uncaught page
errors. Eight guide comparisons were identical. See verification/final-audit-checks.json.

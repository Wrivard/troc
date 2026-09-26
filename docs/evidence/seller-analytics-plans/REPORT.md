# Seller Analytics aggregate plans

Disposable PGlite with all local migrations, backend role, 20,000 seller orders, 80,000 quote lines, 1,000 canonical variant IDs and730days of history. No catalogue or persistent orders were fabricated/added. Three warm EXPLAIN ANALYZE/BUFFERS runs per query/period. These are embedded query timings, not hosted throughput or end-to-end latency.

| Read | Days | Before median ms | After median ms |
|---|---:|---:|---:|
| summary | 7 | 4.54 | 4.25 |
| products | 7 | 4.05 | 3.94 |
| breakdown | 7 | 56.65 | 6.73 |
| summary | 30 | 31.51 | 30.13 |
| products | 30 | 15.57 | 14.77 |
| breakdown | 30 | 53.20 | 8.94 |
| summary | 90 | 57.15 | 57.48 |
| products | 90 | 61.63 | 54.93 |
| breakdown | 90 | 54.24 | 24.59 |

## Finding and implementation
The province/availability query materialized19,999 eligible historical rows, then discarded19,805 for the7-day province aggregation. `eligible AS NOT MATERIALIZED` lets PostgreSQL inline each reference: province dates can reach the existing seller/date seek index, while dataset availability EXISTS can stop on the first eligible match. No index, schema, dependency, permission or data mutation added to application code. Availability still spans historical eligible orders, independently of selected period/dataset.

Summary and product aggregation remain proportional to selected-period orders/lines. Product response and artwork hydration remain bounded but a LIMIT does not make the upstream grouping constant-time. No million-scale claim. Missing datasets can still require scanning historical eligibility; historical rollups and native PostgreSQL load remain future evidence-dependent work.

## Verification
- `scripts/measure-seller-analytics-plans.ts --optimized`:9queries,27plans;12exact response comparisons against prior materialized query across7/30/90days, live/sample, mixed history and no eligible sample orders. The no-sample scenario cancels only the isolated fixture sample order, preserving immutable provenance.
- Existing420-order analytic oracle/access/overflow/cursor/HTTP test passes; API TypeScript, scoped ESLint and build pass.
- Owned local API40748restarted as59376. Unchanged catalogue seed skipped. Local browser all3Analytics reads200, existing8sample orders and2603cents remain; no legacy operations or POST. Existing `seller-analytics-ui/live.json` refreshed.
- Initial no-sample fixture attempted to change immutable demo provenance and was rejected; corrected fixture uses cancellation, no trigger bypass. First local browser check ran before restart readiness; after the ready log and listener were verified, the check passed.

## Next
Define bounded full source-order CSV export using current permission/period/dataset semantics, stable order identity, safe amounts and explicit consistency/cap behavior; daily aggregate export is already delivered. Hosted PostgreSQL concurrency/large-history capacity remains unverified and release gates unchanged.

# Seller Analytics UI integration

## Delivered
- Reuses existing screen and chart presentation, replacing the legacy capped200-order operations read with three dedicated endpoints.
- Whole-period metrics/daily series, province counts and25-product canonical ranking. Next/previous does not refetch summaries. Period/dataset changes reset cursor history, including returning to an earlier period.
- Same asOf throughout the mounted seller screen; this is a period reference, not an MVCC snapshot. Concurrent order changes may affect subsequent pages.
- Summary, provinces and ranking have independent request identity, loading and retry. Old scope responses cannot overwrite new selection. Initial breakdown establishes sample/live default and exposes retry/management denial.
- CSV now explicitly exports daily totals (UTC, CAD and prior-period comparisons). It does not pretend to export all underlying orders. Full source-order export remains pending.

## Verification
- `scripts/check-seller-analytics-ui.cjs`: EN1440/FR390 intercepted contracts with300/900orders and37ranked variants; page boundaries/rank offset, failure/retry, no summary refetch on pagination, delayed7-day response rejected after90-day selection, return30-day reset, CSV exact values, shared asOf, no legacy operations, no viewport overflow. check.json.
- `scripts/check-seller-analytics-errors.cjs`: recoverable bootstrap failure; independently failed summary with product empty state; export disabled until valid nonempty totals; empty summary;403denial does not start dependent reads or expose metrics. errors.json.
- `scripts/check-seller-analytics-live.cjs`: owned local API restarted54900->40748; all Analytics HTTP200,8sample orders/2603cents, real persisted sample products, no legacy operations or POST. live.json.
- Marketplace TypeScript and scoped ESLint pass. Vite client+SSR build passes (public catalogue asset copying disabled; existing assets retained).
- FR mobile full-page and EN local desktop screenshots actually inspected. Existing product table horizontal region retained for narrow screens.
- Initial browser harness selected navbar currency combobox; selector corrected to Analytics toolbar and rerun passed. This was a harness issue, not an application failure.

## Limits / next
No native PostgreSQL scale/concurrency or production certification. Initial availability discovery costs an extra breakdown request to preserve the previous sample-default behavior. Aggregate queries still scan selected history; measure disposable large-history plans next. No new migration/dependency, remote release or external message. Full source-order export and upstream provider/release gates remain open.

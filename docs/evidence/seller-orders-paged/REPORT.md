# Seller Orders: paginated UI integration

Orders alone now uses /order-list and /order-summary. Existing eight-row layout, status priorities, filters, canonical thumbnail mapping and order-detail links are retained.
- URL search/period/status/sort preserved; changing scope resets cursors.
- Previous/Next use visited server cursors and the same asOf cutoff.
- Counts/total come from independent full-history summary, not current page.
- Summary error has its own retry and does not hide loaded rows. It is reused across page navigation with unchanged scope/cutoff.
- Pending/failed list has no stale actionable rows or enabled CSV; retry preserves query. Empty state only follows a successful empty read.
- Late responses are ignored. Search input remains mounted;180ms request coalescing.
- Export explicitly means this page and includes its row count; no unbounded export loop.
- Messages/Analytics remain on original /operations with their existing200scope disclosure.

Verification:
scripts/check-seller-orders-paged.cjs: EN1440/FR390, intercepted209row fixture derived from existing local presentation, independent summary503/retry, count beyond200, Next/Previous, no summary re-fetch on paging,8row CSV, list503/retry, true empty and late-response rejection. No real order writes. Mobile capture opened and inspected.
scripts/check-seller-orders-live.cjs: actual local API, existing8orders, exact UI count/cutoff, disabled last-page control and2row API cursor without overlap. No new orders inserted.
Existing check-order-filter-continuity.cjs EN/FR passes reload, invalid filters, detail/Back, clear preserving sort; zero API write requests.
Disposable251eligible-order backend regression, frontend/API TypeScript and scoped lint pass.

API process22824 was verified as local-accounts.ts, stopped, and replaced by49184 to load new read routes. Startup log confirms existing catalogue/listing revisions skipped; no database double-open or production change. Initial live-test assumption >8 was corrected to the actual8existing orders;209browser fixtures and251isolated DB fixtures remain explicitly separate.

Remaining: server search/aggregate SQL plans and local load evidence, concurrency refresh semantics, full-filter export, separate Messages/Analytics scaling; hosted million-record readiness is not certified.
Final client+SSR builds pass (.local/seller-orders-paged-build.log); existing bundle-size warnings remain.

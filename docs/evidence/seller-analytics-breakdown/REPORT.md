# Analytics product/province reads - local evidence
2026-09-24. Backend implemented; UI and persistent preview activation pending.

Shared sellerAnalyticsScope enforces active-store management role, period7/30/90,live/sample and validated asOf. Reused by summary/products/breakdown; no extra summary fetch for these reads.

/analytics-products: canonical variant UUID grouping over all eligible selected-period quote lines, sums integer merchandise cents/units, deterministic cents DESC/variantID DESC ranking, default25/max50, limit+1 cursor bound to seller/period/dataset/limit and pinned asOf. Same-name variants stay distinct. Display names use latest selected-period quote snapshot by created_at/orderID/line ordinal; no substitution from another variant. Canonical artwork resolver receives returned page IDs only. Monetary/quantity overflow fails; no unsafe roundtrip in cursor. asOf fixes period window, not MVCC snapshot of changing orders.

/analytics-breakdown: province counts use same eligible scope and order-count basis; empty province keeps existing em-dash fallback. Explicit numeric ordering (not lexicographic text count) plus stable province tie. At most50groups with provincesTruncated flag, to disclose unexpected historical scope without unbounded payload. live/sample availability uses eligible noncancelled/nonpending seller history before current UTC day end, independent of selected period/dataset. No buyer details, messages or full quotes returned.

Tests extend420fixture summary oracle across6period/dataset cases:37canonical variant groups with equal displayed names and tied totals, full8-row cursor traversal exact IDs/quantities/cents, artwork page-only IDs, cursor-limit mismatch, invalid input, EN snapshot selection, varied/empty provinces and numeric counts, dataset availability, inventory denial, aggregate overflow, three HTTP endpoints. APItypes/scopedlint/build pass. Initial code review caught text-count ordering risk before test acceptance; qualified numeric source fixed it. Existing daily summary parity continues passing.

No new dependencies/migrations, no preview restart, no production changes. Aggregation still scans selected-period order lines; bounded response does not certify constant-time query/million-order load. Snapshot names/amounts represent quotes, not live catalogue/market prices. Full-history export remains separate; do not silently substitute25products for source-order export.

NEXT: integrate summary/breakdown/product reads into existing Analytics UI, independent errors/stale guards, explicit product paging and honest export scope. Preserve original graphs/metrics/copy, add no invented traffic/conversion data. Activate localAPI only after integration checks; hosted/remote holds unchanged.

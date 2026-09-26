# Seller order-list: local implementation evidence

Added GET /seller/platform/:seller/order-list and modules/seller-platform/order-list.ts. Legacy /operations and UI consumers unchanged.

Implemented:
- Current store-access/fulfillment-or-message permission checks before data queries.
- Bounded filters,8default/50maximum rows, limit+1 seek pagination.
- Newest/oldest/total numeric sort with deterministic timestamp+UUID ties.
- Cursor scopes seller, locale, filters, sort and limit; rejects malformed/oversized/mismatched cursors. Cursor is not authorization.
- Preserves PostgreSQL microseconds in seek keys; pins asOf/cutoff across pages.
- Parameterized literal substring search over ID/buyer/localized line names; refunded includes partial refunds; pending marketplace orders excluded.
- Current canonical thumbnail provider called only with returned-page variant IDs.
- No order-message queries, list-wide counts or aggregates.

Verification: tests/seller-order-list.test.ts uses disposable in-memory PGlite, all repository migrations and backend role.
252 isolated orders (251 eligible+1pending) with tied/submillisecond timestamps, all3sorts at17/page: exact expected ID ordering, no omissions/duplicates past200.
Also validates page-only thumbnail ID batches, literal wildcard/SQL-looking search, EN/FR line names, refunded union, period empty state, malformed/cross-filter/cross-store cursors, bounded inputs, fulfillment/customer-service access, denied inventory/foreign/inactive store and live in-process HTTP routing/invalid query responses.
API TypeScript, scoped ESLint and API build pass. No existing unchanged UI suite repeated.

Limits:
Stable-data traversal proven only at fixture scale. Concurrent status/total changes are not snapshot-isolated; upcoming UI must explain refresh behavior. No SQL plan/index, million-row or hosted latency certification.
Summary API, Orders UI wiring, independent states and page-export disclosure remain next. Messages/Analytics retain their existing200scope warning. No production migration, catalogue expansion or real commerce mutation.

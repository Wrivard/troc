# Seller order substring projection feasibility
Date: 2026-09-24. Disposable prototype only; no application or schema integration.

Evidence: scripts/measure-seller-order-search.ts and docs/evidence/seller-order-search-probe/plans.json. In-memory PGlite, existing migrations through0024, 20,000 test orders, 19,999 eligible, one modified multiline bilingual quote. Real catalogue/inventory/preview untouched. Backend-role SELECTs against actual orderListConditions; candidate text duplicates its concatenation, lowercase, locale and literal LIKE escaping. Full matching ordered IDs compared, not just counts or first page.

26 comparisons pass: EN/FR, broad names, absent text, literal percent/underscore/backslash, apostrophe, concatenated line names, accented text, one/two-character queries and foreign seller scope. This is not full authorization certification; existing access tests remain separate. Temporary projection is readable only by backend role in the isolated DB, never browser clients.

Measured full-match query times, baseline/candidate ms: absent114-130/0.046-0.047; literal50%_115/0.46-0.62; apostrophe113-129/0.066-0.068; multiline116/0.149. Broad EN140/76 and FR134/83 still scan many matches; one-character129-134/78-79, literal punctuation8-10ms, two-character31-33ms. GIN does not make every query constant-time. These are single embedded samples with warm fixture data, not page load percentiles, million-order or hosted evidence.

Freshness defect intentionally reproduced: after changing a marketplace order recipient, authoritative query finds1 and copied projection0. Thus a one-time backfill cannot be integrated safely. DB closes in finally. Initial fixture query failed with42P18 from missing text cast in jsonb_build_object; corrected parameter type and full probe passed. Subsequent source lookup used a nonexistent analytics filename; corrected through actual import/file discovery.

Next integration requirements:
1. Preserve exact concatenated ID + recipient fallback + selected-language quote-line text. Missing translation remains omitted, matching current contract; do not add fuzzy/catalogue/current-name substitutions.
2. Transactional maintenance on seller_orders INSERT and changes to quote, marketplace_order_id or seller_id; marketplace_orders address UPDATE refreshes every linked seller row in the same transaction. DELETE cascades/cleanup required. Status/created_at/demo remain authoritative joins, not asynchronously cached eligibility.
3. Lock ordering/concurrent address and quote changes must prevent lost projection updates. Test simultaneous parent/child changes on real multi-connection PostgreSQL before hosted enablement; PGlite cannot certify contention.
4. RLS enabled, PUBLIC/anonymous denied, runtime read only; tightly scoped fixed-search-path trigger privileges if needed. Projection includes buyer personal data and inherits order retention/deletion, never public search/cache. Authorization runs before reads.
5. Migration backfill and concurrent writers need a consistent transactional activation strategy. Avoid silently dropping existing results if a projection row is absent; candidate completeness check before activation. Measure index size, write amplification and large-store distribution; do not infer from20k.
6. Regression: INSERT, quote edits, recipient edits affecting multiple sellers, reparent, seller changes, rollback, delete, null/missing names, accents, literal wildcard escaping, all sort/cursor/refund/period semantics and denied access. Prove indexed plan and parity before replacing production predicate.
7. Separate summary global-priority scan from filtered search counts when integrating; current MATERIALIZED summary still scans all eligible orders and cannot gain selectivity from merely changing a boolean predicate to a joined projection.

Decision: candidate justified for further implementation, not ready to activate. Keep current correct substring path until transactional maintenance and parity pass. No new dependency or hosted service needed; existing pg_trgm suffices for this probe.

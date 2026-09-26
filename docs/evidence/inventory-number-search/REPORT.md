# Inventory number search — local evidence

## Inventory collector-number search and E4.3 reconciliation — September 25

Manual catalogue lookup and seller inventory search now reuse the catalogue collector-number rules, including optional #, leading zero normalization and exact set denominator. Distinct canonical variant IDs remain selectable. Numeric one-character lookup is accepted; name/SKU matching remains supported. Real local EN1440/FR390 form submissions find AZ's Tranquility via76/86 and submit a one-digit number. No listings were created by browser QA.

Verification:12inventory tests pass, including exact denominator/variant/SKU matching,100/1000/10001-row imports, duplicate handling, reservation/version guards, photo-policy drafts and private-table access. API/frontend typechecks, scoped lint and API/client/SSR builds pass. Test cleanup now rolls back its isolated fixture (the initial failure was an outbox FK during cleanup). FR browser assertion uses canonical option ID rather than English display text. Local API60228replaces60720; readiness verified. Evidence: Troc-UX-Design/docs/evidence/inventory-number-search/. No hosted or million-row performance certification.

Next ready coherent batch: expose existing listings.storage_location as optional private seller bin/rangement through manual + CSV + edit + inventory display/search. Reuse existing column and optimistic version guard; do not add a duplicate location model. Verify round-trip, empty clear, oversized input, cross-store denial, conflict preservation, public-data exclusion and EN/FR UI before closure. E4.3 remains partial: photo schema/policy exists but upload requires UP01; inventory export is absent from current router/UI (Analytics export is different); listing offers must be reconciled with E4.5 before introducing controls.146original IDs retained; solo/remote/source/auth/stock/money holds unchanged.

Browser harness: scripts/check-inventory-number-search.cjs. Real API, isolated synthetic seller sessions; no intercepted requests or persistent inventory mutations.

# Seller order SQL plans - September 24
Author checks, disposable PGlite, all migrations and troc_backend role. 20,000 fixtures / 19,999 eligible; five timestamp groups, one line/order. Tie-heavy scenario, not representative hosted capacity. No preview/catalogue/inventory writes.

Original vs candidate-index first-page timings (ms): newest19.989/0.097, oldest17.891/0.089, total68.435/0.118, broad English147.538/0.152. Date index reduced marketplace joins4001 to9. Rare/absent substring searches remain ~139ms.

Searched summaries repeated the correlated line-name aggregation three times (59,997 executions). Narrow MATERIALIZED CTE computes it once (19,999). Summaries278-286ms become145-149ms. No-query summaries stay NOT MATERIALIZED, ~53-56ms. Narrow intermediate stores status/total/demo/match only. Single embedded samples, not percentiles or hosted SLA.

Actual migration0024 tested in final harness. Deep cursors after15,000 reference rows verify exact IDs for all3sorts: newest5.855 to0.093ms, oldest6.124 to0.090ms, total42.535 to0.090ms. OFFSET exists only in the fixture oracle.

API regression seller-order-list.test.ts passes:252fixtures,251eligible, full pagination/permissions/filter/summary/overflow/HTTP coverage. APItypes/build/scopedlint pass.30final plans captured; DB closed in finally. No UI changes; unchanged browser checks not rerun.

Files: order-summary.ts, migration0024_seller_order_read_indexes.sql, scripts/measure-seller-order-plans.ts. Artifacts plans.json, plans-after-summary.json, plans-final.json. Migration not applied to persistent preview/production; API49184 not restarted. Index write overhead/production build locking still unverified. Existing index preserved pending other-consumer review.

Tool incidents: sandbox helper ACL failure recovered using narrow escalated workspace commands; duplicate dir in first harness corrected before DB opened; Windows-invalid rg glob changed no files; initial report write encoding failed, rewritten explicitly UTF-8. No approval rejection.

NEXT: disposable EN/FR substring-projection feasibility and write-freshness/parity contract, then separate Messages/Analytics scale contracts. Hosted concurrency, million-order distributions, many-line quotes, aggregate scale and full export remain open.

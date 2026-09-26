# Next inventory batch: bounded private export

Source-confirmed gap: Inventory router and UI have no export; Analytics source-order CSV is unrelated. Preserve existing CSV import semantics: importing an export must still flag existing SKUs as duplicates, never silently overwrite stock.

Implement one authenticated inventory-authorized GET returning a statement-consistent CSV for current seller/filter scope, excluding pagination cursor. Share list filter semantics (name/SKU/location/collector number, source, status, sync, low stock). No asset hydration for CSV. Do not silently export only the visible51rows.

Use canonical variant_id plus condition, exact integer-cent CAD price text, quantity, seller_sku, storage_location and useful source/external identifiers. Keep private location inside this seller-authorized response; no public DTO changes. Quote cells, double embedded quotes and neutralize spreadsheet formulas in arbitrary text. If formula protection changes a text value, disclose that spreadsheet-safe export is not a lossless backup. UTF-8 French text supported.

Adopt an explicit row/byte cap with cap+1 detection before response; fail clearly rather than truncate. Prefer existing Analytics cap/error/CSV utilities where compatible, without coupling inventory authorization to Analytics management role. No unbounded browser accumulation. No price/stock writes, reservations or automatic import.

UI: export current filters, disable duplicate click, loading/error/retry, ignore late response after seller/filter change, explain caps and current-value snapshot. Verify exact IDs/filters/price, formula+quote/newline+accent cells, limits, permission/no-store, scope changes and EN/FR download. Hosted load remains separately gated.


Implemented locally; see docs/evidence/inventory-export/REPORT.md for verified boundaries.

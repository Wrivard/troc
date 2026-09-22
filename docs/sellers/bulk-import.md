# Bulk CSV import

Status: **In development**. Generic CSV format, not a claimed CardUploader, SortSwift or marketplace integration.

1. Upload UTF-8 CSV (up to 4 MiB and 20,000 rows).
2. Review detected columns or choose mappings; optionally save a mapping for your seller account.
3. Select a provenance source. This does not connect an external account.
4. Preview canonical matches and row validation. Each row is matched, unmatched, ambiguous, invalid or duplicate; no failed row is silently dropped.
5. Correct flagged rows in the source file and upload again. For ambiguous cards, choose the correct TROC variant ID after checking the printing. All rows must be valid before publication.
6. Publish the reviewed preview. All rows commit together, or none do. Retrying the same publication is safe.

Required fields: `condition` (NM/LP/MP/HP/DMG), decimal CAD `price`, integer `quantity`, and unique `seller_sku`. Canonical identity is `variant_id`, or `provider` plus `external_catalog_id`, or exact `name`, `set` (set slug), `number`, `language` and `finish`. Optional external SKU and listing ID preserve source identities.

Price values use a decimal point and at most two decimal places; no currency symbols, exponent notation or thousands separators. Quantity is 0–1,000,000. Quoted commas, quotes and newlines are parsed; malformed quotes and duplicate headers are rejected. Empty lines are ignored; malformed data rows remain visible as invalid.

Imports create new listings. Existing seller SKUs or source/listing IDs are flagged for review rather than merged or overwritten. Update existing stock in inventory management. If inventory changes between preview and publish, re-preview. Preview publication expires after 24 hours. Graded/sealed item creation requires a later grading workflow.

Photo-required listings are saved as drafts according to the commerce setting photoThresholdCents. Activation requires existing listing photos; the later seller platform will supply the photo-upload workflow. No imported high-value item bypasses this gate.

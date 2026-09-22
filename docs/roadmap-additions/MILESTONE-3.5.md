# Milestone 3.5 — Frictionless Seller Inventory & Integration-Ready Architecture

## Purpose
Milestone 3 is already complete. Review it first and extend it without unnecessarily rebuilding working functionality.

Goal: **sellers should not have to recreate or independently maintain their inventory just to sell on TROC.**

## Requirements
### Catalogue/listing audit
Confirm canonical card data is separate from seller listings. Canonical records should support TROC card ID, game, set/code, name, number, rarity, language, finish/variant, image reference and external catalogue IDs. Listings should reference a canonical card and hold seller-specific condition, price, quantity, seller/external SKU, inventory source, external listing ID, sync status and timestamps.

Do not duplicate canonical cards because multiple sellers list the same card. Preserve Milestone 3 architecture where already correct.

### Integration-ready inventory
Support source concepts for TROC manual, CSV, CardUploader, SortSwift, eBay, Shopify, TCGplayer and future integrations. Prepare fields such as `source_platform`, `seller_sku`, `external_sku`, `external_listing_id`, `sync_status`, `last_synced_at`, `sync_error`, quantity and price. Do not implement fake integrations.

### Manual listing
Search canonical card → select → condition/variant → price → quantity → publish. Prefer structured catalogue listings over free-text listings.

### Bulk import
Build generic CSV import architecture: upload → map/detect fields → canonical matching → validation → unmatched/ambiguous review → preview → publish. Make mappings reusable for future CardUploader/TCGplayer formats. Report matched, unmatched, ambiguous, invalid and duplicate rows. Never silently discard failures.

### Inventory dashboard
Provide scalable active/sold-out inventory management with source, sync status, quantity, price, errors, search/filter and appropriate bulk actions.

### Inventory events
Prepare event concepts such as `inventory.created`, `inventory.updated`, `inventory.quantity_changed`, `inventory.sold_out`, `listing.created`, `listing.updated`, `listing.removed`. Design for idempotency/retries.

### Documentation
Document catalogue/listing architecture, inventory sources, imports, external IDs/SKUs and future synchronization strategy.

## Audit
Test 100, 1,000 and 10,000+ row imports; duplicate/ambiguous matching; indexes/query performance; authorization/RLS; bulk-operation safety; canonical duplication risk; future API compatibility. Fix and optimize before proceeding.

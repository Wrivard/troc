# Inventory architecture

Status: **In development**; migration `0008_seller_inventory.sql` must be applied before hosted activation.

Existing listing UUIDs, canonical references and seller SKUs are preserved. Additive columns provide source platform, external SKU/listing ID, sync status, last-sync/error fields and inventory version. Sources are data rows so future platforms can be added through controlled migrations; a source name is not a live integration. Existing records default to `manual` and `not_connected`.

Seller SKU is unique within a seller. External listing ID is unique within seller and source. External SKU alone is not assumed globally unique. Seller inventory writes use authenticated active owner/manager/inventory membership; public browser roles have no direct table access. The backend role has explicit grants and RLS policies; tenant authorization is enforced by the service before seller-scoped queries.

CSV previews retain normalized rows and validation results, not uploaded files. A bounded import supports up to 20,000 rows / 4 MiB; matching and insertion use 500-row batches. Publication is atomic and create-only: duplicates cannot silently overwrite quantities. Stored previews expire for publication after 24 hours. Request keys with payload hashes make preview retries deterministic; publishing the same import returns the committed count without repeating inserts.

Bulk changes are atomic, capped at 100 explicit listing IDs, and require the current inventory version. Listing locks use deterministic ID order. A live checkout reservation blocks seller edits. The database increments the version even for checkout and restock updates, rejecting stale seller edits after a sale. Seller-level serialization protects duplicate checks and publication; unique constraints remain the final race defense.

Keyset pagination limits responses to 50 listings. Indexes cover seller/id, seller/status, seller/source and seller/sync state. Canonical exact-name matching has expression indexes. Substring search remains bounded per page but may scan a seller's inventory; larger production datasets require measured query-plan review.

Import data is private seller data. Define operational retention/purge policy before broad hosted use; do not expose previews, errors or external identifiers on public catalog responses. Actual webhook delivery, external credentials and live synchronization are Milestone 4.5 work.

# API scope and inventory contract

Status: **In development** internal authenticated browser API. Public seller API credentials/versioning/webhooks are **Planned** for 4.5.

The existing Supabase session establishes the user. Seller routes require an active owner/manager/inventory membership for the requested seller. Same-origin mutation protection and no-store caching are inherited from the foundation router. Routes have bounded rate limits; other APIs retain the original 16 KB body limit, while inventory import previews permit bounded CSV payloads.

Under `/api/inventory`:

| Method/path | Purpose |
|---|---|
| GET `/sellers` | Authorized active seller choices |
| GET `/:seller/sources` | Provenance source choices |
| GET `/:seller/catalog?q=...` | Bounded canonical search |
| GET `/:seller/listings` | Seller-scoped inventory; q/status/source/sync/after filters, 50 rows |
| POST `/:seller/listings` | Manual creation with variantId, condition, priceCents, quantity, sellerSku, requestKey |
| POST `/:seller/bulk` | Up to 100 explicit id/version edits: quantity, priceCents, status |
| GET `/:seller/mappings` | Saved column mappings |
| POST `/:seller/imports` | CSV, mapping, optional mappingName, source, requestKey → preview ID and summary |
| GET `/:seller/imports/:id?page=0` | Review rows and counts |
| POST `/:seller/imports/:id/publish` | Atomic idempotent publication |

Inventory versions are required for edits. `inventory_changed`, `inventory_reserved`, `inventory_changed_repreview`, `import_needs_review`, `preview_expired` and `idempotency_conflict` require explicit review/retry rather than blind overwrites. SQL/provider details are not returned to clients. There is no external delivery worker or `/api/v1` partner API in this milestone.

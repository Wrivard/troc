# Inventory synchronization

Status: **Planned** live synchronization; source fields and durable event/version foundation are **In development** in 3.5.

Source platforms include manual TROC, CSV, CardUploader, SortSwift, eBay, Shopify and TCGplayer. These are provenance labels only. No partnership, credential connection or live synchronization is claimed.

Future adapters must retain stable seller/source identities, use revocable scoped authentication, handle duplicate/out-of-order events, respect current inventory versions and reservations, retry safely, and surface conflicts. Never report a stale or failing connection as healthy. Actual connected integration models, delivery records and reconciliation are assigned to 4.5.

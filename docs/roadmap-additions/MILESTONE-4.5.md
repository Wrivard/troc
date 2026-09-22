# Milestone 4.5 — TROC Seller API & Live-Sync Foundation

## Purpose
Make TROC capable of becoming a destination supported by third-party inventory systems: **inventory manager → TROC API → TROC marketplace**.

## Requirements
### Versioned API
Establish secure versioned architecture such as `/api/v1/` for catalogue/cards, listings, inventory and orders. Support appropriate retrieval, create/update/deactivate listing, quantity/price updates and seller-order retrieval without exposing direct database access.

### Authentication/authorization
Use revocable, appropriately scoped credentials. Sellers can access only authorized resources. Never expose secrets client-side. Log sensitive operations.

### Reliability
Implement payload validation, structured errors, rate limiting, reasonable batch limits, request logging and abuse protection. Add idempotency for retried inventory/order writes.

### Webhooks
Prepare signed, identifiable webhook events including `order.created`, `order.cancelled`, `order.refunded`, `inventory.updated`, `listing.sold_out`, with delivery history, retries, failed-delivery visibility and duplicate protection.

### Sync health
Model connected integration, last successful sync, failed sync, pending updates, conflicts and manual reconciliation. Never show stale integrations as healthy.

### Integration docs
Prepare internal integration specifications for SortSwift, CardUploader, eBay, Shopify and future systems. Do not claim official partnerships/live support until real.

### Public developer docs architecture
Prepare future docs for overview, authentication, cards, listings, inventory, orders, webhooks, errors, rate limits and changelog/versioning.

## Audit
Test cross-seller authorization, secrets, rate limits, webhook signatures/retries/duplicates, idempotency, race conditions and large batches. Fix and optimize.

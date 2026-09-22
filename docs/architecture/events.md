# Inventory events

Status: **In development** durable event foundation; external delivery is **Planned**.

`inventory_outbox` is append-only. Listing insert/update triggers record committed state with listing ID, seller ID, version, event ID, canonical variant, quantity, CAD price, status and source. Events include `inventory.created`, `inventory.updated`, `inventory.quantity_changed`, `inventory.sold_out`, `listing.created`, `listing.updated` and `listing.removed` (archive). Checkout and cancellation restocks also pass through these triggers.

The unique `(listing_id, version, event)` key identifies a state transition; downstream consumers can deduplicate on event ID and reject stale versions. Transaction rollback removes associated events. Publication retries do not create another batch of events.

Milestone 4.5 will add separately mutable delivery attempts, leases, exponential retries, signatures, dead-letter visibility, reconciliation and scoped external credentials. Consumers must assume at-least-once delivery; there is no claimed live webhook transport in 3.5. Existing inventory quantity audit events remain intact alongside the state-event outbox.

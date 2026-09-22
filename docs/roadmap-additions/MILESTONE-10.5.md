# Milestone 10.5 — Collection → Marketplace Flywheel

## Purpose
Unify buyer and seller behavior around collectors. Collection ownership should connect naturally to selling, wishlists and demand.

## Requirements
### Collection
Allow tracking canonical cards, quantity, condition and variant/language where appropriate. Prepare scalable import architecture.

### Collection → Sell
Enable eligible owned cards to become listings with minimal duplicate data entry: select owned card → selling details → publish. Reuse canonical catalogue data.

### Wishlist → Buy
Connect collection gaps/wishlists to live inventory and Smart Cart.

### Demand opportunities
Where privacy-safe and accurate, show collection owners that some owned cards have marketplace demand. Never imply guaranteed sales.

### Valuation
If displaying collection value, state the methodology/source. Do not fabricate valuation. Distinguish listing/reference estimates from actual TROC transaction data.

### Import/export
Prepare collection import/export around canonical IDs and reusable mapping architecture.

### Privacy
Collections are private by default unless the user explicitly chooses otherwise. Do not expose ownership or wishlist information to sellers at an individual level without explicit product design/consent.

### Documentation
Document collection model, sell flow, wishlist relationship, valuation methodology, imports/exports and privacy.

## Audit
Test large collections, duplicates, variants, imports, collection-to-listing transitions, privacy boundaries, valuation edge cases and query performance. Fix and optimize.

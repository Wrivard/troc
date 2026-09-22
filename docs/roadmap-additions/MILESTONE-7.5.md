# Milestone 7.5 — Wishlist & Demand Network

## Purpose
Turn buyer intent into a marketplace network effect. Wishlist data should connect demand with live seller inventory.

## Requirements
Allow users to save canonical cards with optional quantity, condition, language, finish/variant and maximum price; remove/mark acquired.

Show real availability, matching listing count, lowest relevant listing and sellers where appropriate. Never fabricate availability.

Design scalable matching between new inventory and existing wishlists; avoid naive all-to-all comparisons.

Prepare configurable, deduplicated alerts for wanted-card availability, target prices, sellers matching multiple wanted cards and material wishlist-coverage improvements. Users control frequency/channels.

Aggregate demand for seller intelligence while protecting buyer privacy: most wanted cards, interested-user counts, current supply and demand with little/no supply. Do not present wishlist counts as guaranteed buyers.

Protect demand data from bots, duplicate/fake accounts and stale/artificial demand.

Document wishlist behavior, matching, alerts, aggregation, privacy and seller insights.

## Audit
Performance-test large wishlists/catalogues/inventory batches. Review notification deduplication, privacy, indexes/query performance and demand integrity.

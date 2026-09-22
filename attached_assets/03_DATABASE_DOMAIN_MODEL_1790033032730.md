# Database & Domain Model

Use relational PostgreSQL modeling with proper foreign keys, indexes, constraints and timestamps.

## Identity
- users
- user_profiles
- addresses
- user_preferences

## Sellers
- seller_accounts
- seller_applications
- seller_members
- seller_member_roles
- seller_levels
- seller_plans
- seller_plan_entitlements
- seller_badges
- seller_badge_assignments
- seller_settings
- seller_verification_status
- seller_followers

## Catalog
- games
- set_releases
- catalog_products
- printings
- variants
- catalog_aliases
- external_catalog_mappings
- asset_sources / asset_provenance
- grading_companies

Canonical hierarchy:

Game
→ Set Release
→ Product
→ Printing
→ Variant
→ Seller Listing

Do not make an external provider ID the TROC primary identity.

## Listings/inventory
- listings
- listing_photos
- inventory_events
- inventory_reservations
- seller_skus / storage_location fields

Listings reference canonical variants.

## Pricing
- reference_prices
- price_history
- fx_rates
- provider_price_snapshots

Store provider, provider product ID, source currency/price, condition/variant/grade where applicable, provider update timestamp, TROC capture timestamp, FX rate/date, converted CAD value.

Do not call external reference data "TROC Market Price".

## Promotions
- promotions
- promotion_rules
- coupons
- promoted_listing_settings

## Cart
- carts
- cart_items

## Orders
- marketplace_orders
- seller_orders
- order_items
- order_events
- shipment_records

One Marketplace Order can contain many Seller Orders.

## Fees/payments
- simulated_payments
- fee_ledger
- processing_fee_allocations
- simulated_payouts
- payout_holds

Keep financial ledgers append-oriented/auditable.

## Marketplace credit/rewards
- credit_ledger
- reward_rules
- reward_events

Never treat a computed balance as the source of truth; ledger is source.

## Trust
- reviews
- review_events
- conversations
- messages
- message_attachments
- offers
- offer_events
- reports/issues

## Collector
- collections
- collection_items
- master_set_definitions
- master_set_items
- user_master_sets
- wishlists
- wishlist_items
- want_lists
- want_list_items
- saved_searches
- price_alerts

## Buylist
- buylist_profiles
- buylist_items

## Notifications
- notifications
- notification_preferences

## Catalog governance
- catalog_corrections
- catalog_correction_events

## Admin
- admin_actions
- moderation_notes

## Demo
- demo_batches
- demo_provenance where required

## Real lead capture
- buyer_waitlist
- founding_seller_leads
- lgs_partner_leads
- partner_investor_leads

Real leads MUST NOT be purged with demo marketplace data.

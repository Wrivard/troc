# Routes, QA & Acceptance

## Public
/, /search, /games/[slug], /sets/[slug], /product/[slug], /store/[sellerSlug], /condition-guide, /sell, /founding-sellers, /developers, /about, /help, /style-guide

## Account
/sign-in, /sign-up, /account, /account/orders, /account/orders/[id], /account/messages, /account/notifications, /account/wishlist, /account/price-alerts, /account/following, /account/credit, /account/settings

## Collector
/collection, /collection/[game], /collection/[game]/[set], /want-lists, /want-lists/[id], /smart-cart

## Commerce
/cart, /checkout, /order-confirmation/[id]

## Seller
/seller/apply, /seller, /seller/orders, /seller/orders/[id], /seller/inventory, /seller/inventory/import, /seller/listings/new, /seller/promotions, /seller/offers, /seller/analytics, /seller/storefront, /seller/team, /seller/settings, /seller/plan, /seller/buylist

## Admin
/admin, /admin/seller-applications, /admin/sellers, /admin/users, /admin/catalog, /admin/catalog-corrections, /admin/listings, /admin/orders, /admin/issues, /admin/reviews, /admin/promotions, /admin/reference-pricing, /admin/demo-data, /admin/leads, /admin/audit

## Tests
Unit: fees, minimums, promotions, shipping aggregation, credit ledger, permissions, Smart Cart constraints.
Integration: listing→cart→optimize→checkout→seller order→ship→review; seller application→approval→import; collection→missing cards→Smart Cart.

## Acceptance
Reviewer can browse/search, compare seller offers, buy low-value cards across sellers, see minimum/promotion progress, use Smart Cart, complete simulated checkout, view orders, apply/approve seller, import inventory, view storefront, use collection/master set/want list, alerts/follows, EN/FR, mobile/desktop, admin, and purge demo data without losing catalog or real leads.

Approved `/style-guide` remains intact.

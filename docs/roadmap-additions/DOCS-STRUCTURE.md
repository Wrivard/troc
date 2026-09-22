# TROC Documentation Structure

Create and maintain internal project documentation alongside implementation. Public docs/help can later be generated from appropriate, non-sensitive material.

Suggested repository structure:

```text
/docs
  /product
    product-vision.md
    marketplace-strategy.md
    marketplace-flywheel.md
    buyer-moat.md
    seller-moat.md
    launch-strategy.md
    roadmap.md

  /marketplace
    marketplace-rules.md
    fees.md
    seller-standards.md
    buyer-protection.md
    seller-protection.md
    disputes.md
    returns.md

  /sellers
    seller-onboarding.md
    founding-seller-program.md
    seller-referral-program.md
    inventory-management.md
    inventory-sync.md
    bulk-import.md

  /buyers
    buyer-onboarding.md
    wishlist.md
    smart-cart.md
    collection.md
    alerts.md

  /shipping
    shipping-system.md
    lettermail.md
    tracked-shipping.md
    packaging.md
    lost-mail.md

  /integrations
    integration-strategy.md
    sortswift.md
    carduploader.md
    ebay.md
    shopify.md
    tcgplayer.md
    csv-import.md

  /api
    overview.md
    authentication.md
    cards.md
    inventory.md
    listings.md
    orders.md
    webhooks.md
    rate-limits.md
    versioning.md

  /growth
    prelaunch.md
    buyer-waitlist.md
    seller-waitlist.md
    referrals.md
    founding-sellers.md
    launch-metrics.md

  /architecture
    database.md
    catalog.md
    inventory.md
    integrations.md
    events.md
    payments.md
```

## Status labels
Documentation must distinguish:
- Planned
- In development
- Beta
- Live

Never document planned functionality as already available.

## Public docs
Future `docs.troc.ca` should provide clear documentation/help for buyers, sellers, integrations, shipping, policies and developers while never exposing secrets, private operational procedures or security-sensitive architecture.

## Product flywheel
Seller imports existing inventory → more Canadian inventory → buyers find more wanted cards → Wishlist + Smart Cart improve buying → more transactions → TROC gains Canadian transaction/demand data → sellers see demand → sellers add inventory → sellers refer sellers → more inventory → repeat.

# Locked TROC Product Decisions

These decisions are already approved. Do not re-decide them during implementation.

## Brand
- Brand: TROC
- Default visual system: red + black/charcoal + white/off-white + grey.
- Strong italic TROC wordmark.
- Custom TROC maple-leaf symbol.
- Canada-first positioning.
- Existing `/style-guide` is approved and must be reused.

## Marketplace
- Canada-only buyers and sellers initially.
- Account required to buy.
- Sellers must be 18+.
- CAD only initially.
- English/French from launch.
- Seller shipping only within Canada initially.
- Marketplace-first homepage, not a SaaS landing page.

## Games
- Pokémon
- Magic: The Gathering
- Yu-Gi-Oh!
- One Piece
- Riftbound

## Products
MVP product types:
- raw singles;
- graded cards;
- sealed products.

Languages:
- English;
- Japanese where applicable.

Conditions:
- NM;
- LP;
- MP;
- HP;
- DMG.

Variants must be game-specific/data-driven.

## Photos
Photos required for:
- graded cards;
- signed/altered/special listings;
- high-value raw listings, initially CAD $50+.

Threshold must be configurable.

## Seller identity
Seller type:
- Individual Seller;
- Professional Seller;
- Verified Online Seller;
- Verified Hobby Shop.

MVP launch:
- seller access is invite/application based;
- admin approves sellers manually;
- architecture prepared for real KYC/payment verification.

## Seller systems
Reputation:
- New;
- Established;
- Trusted;
- Elite.

Plans:
- Free;
- Pro;
- Business.

Badges:
- Identity Verified;
- Top Seller;
- Verified Hobby Shop;
- Founding Seller.

Trust/reputation cannot be purchased.

First 250 approved Founding Sellers:
- Founding Seller badge;
- Pro free forever.

## Fees
Target production economics:
- 8% marketplace commission on merchandise;
- 0% marketplace commission on shipping;
- $0 listing fee;
- no buyer service fee;
- payment processing shown separately/pass-through;
- promoted listings may add an attributable percentage.

These values must be configurable, not scattered as magic numbers.

## Shipping
- standardized platform shipping classes;
- automatic combined shipping;
- seller handling-time choice;
- free-shipping feature is level-gated;
- entry level cannot enable free shipping;
- tracked shipping threshold configurable, initial planning value about CAD $50.

## Storefronts
Seller storefronts are a major differentiator.
They should be more brand-forward than TCGplayer:
- logo;
- banner;
- inventory;
- deals;
- reviews;
- seller story;
- search within seller;
- follower count;
- wishlist/master-set matches;
- LGS details where applicable.

Initial URL:
`/store/[sellerSlug]`

Custom seller domains are post-MVP.

## Commerce
- one buyer checkout;
- multiple Seller Orders internally;
- fixed processing cost modeled once per buyer transaction, then allocated across seller orders for reporting;
- low-value cards can be listed;
- seller minimum-order choices initially None / $2 / $5 / $10;
- automatic seller promotions;
- coupons;
- offers on eligible photo/graded/high-value listings;
- no auctions in MVP.

## Buyer/collector
- collections;
- visual set binders;
- master-set tracking;
- customizable master-set definition;
- want lists;
- shareable want lists;
- wishlist;
- saved searches;
- price alerts;
- estimated collection value;
- Find Missing Cards → Smart Cart;
- follow sellers.

## Rewards/credit
Marketplace credit exists in MVP as a simulated ledger.
Rewards should encourage consolidated/multi-card orders.
Exact production reward rate remains configurable.

## API/integrations
Not public in MVP.
Mention as planned:
- TROC API;
- CardUploader;
- SortSwift;
- future TROC Scan;
- future multi-channel inventory sync.

Never imply a partnership exists unless actually signed.

## Future, not MVP
- real payments/payouts;
- card scanner/computer vision;
- eBay/Shopify inventory sync;
- Canada Post label purchasing;
- presales;
- auctions;
- livestream commerce;
- POS;
- native mobile app;
- social network;
- custom seller domains;
- advanced authentication service.

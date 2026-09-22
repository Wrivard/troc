# Master roadmap

Milestones 1–3 are complete for sequencing per the user. Existing hosted activation and provider-license limits remain documented in `IMPLEMENTATION_STATUS.md`. Do not restart them. The approved visual system remains the source of truth.

| Order | Milestone | Current scope/status |
|---|---|---|
| 0 | Approved style guide | Existing implemented visual foundation |
| 1 | Foundation | Existing implementation; hosted activation limits retained |
| 2 | Catalog + Public Marketplace | Existing implementation and approved bounded sample |
| 2.5 | Marketplace polish | Existing completed polish |
| 3 | Low-Value Commerce | Existing local cart/Smart Cart/checkout; hosted authenticated activation blocked |
| **3.5** | **Frictionless Seller Inventory & Integration-Ready Architecture** | **Implemented/audited and application deployed; hosted activation In development** |
| 4 | Seller Platform | In development in a separate task: bounded applications/manual approval/teams/dashboard. Reuse 3.5 inventory; broader scope remains planned |
| 4.5 | Seller API & Live-Sync Foundation | Planned; public credentials, signed webhooks, delivery/retry workers and sync health |
| 5 | Collector + Trust | Planned |
| 5.5 | Founding Seller & Seller Referral System | Planned; activation-based qualification, configurable benefits |
| 6 | Admin + Demo + Leads + Future | Planned |
| 6.5 | Pre-Launch Buyer & Seller Growth System | In development in a separate task; user authorized safe isolated early work |
| 7.5 | Wishlist & Demand Network | Planned |
| 8.5 | Smart Cart expansion | Planned; extend Milestone 3 optimizer, never create a duplicate cart system |
| 9.5 | Canadian Market Data | Planned; legitimate transactions and minimum quality/sample thresholds |
| 10.5 | Collection → Marketplace Flywheel | Planned |

The supplied original roadmap ends at 6. No original Milestones 7–10 were supplied; their existence or scope is not invented here. Later `.5` additions retain their supplied numbers.

Milestone 3.5 intentionally brings the inventory/listing/CSV subset of original Milestone 4 forward. Seller approval, teams, promotions, storefront configuration, seller analytics, referrals and public integration delivery remain later work. Milestone 8.5 extends the already implemented Milestone 3 delivered-cost optimization with demand/wishlist inputs and further preferences.

This implementation task stops after 3.5 audit and release. The user subsequently gave explicit direction for bounded parallel Milestone 4 and isolated Milestone 6.5 work. Their exact ownership, dependencies and serialized integration gates are recorded in [coordination](../COORDINATION.md). Neither parallel track is integrated or complete merely because it is authorized.

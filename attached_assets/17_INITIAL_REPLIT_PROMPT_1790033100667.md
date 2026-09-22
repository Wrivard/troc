# Initial Replit Prompt — Start TROC After Style Guide Approval

The TROC style guide in this Replit project is APPROVED.

Do not redesign it.

I am attaching a new product-specification pack for the rest of the TROC marketplace.

Your task right now is NOT to build the entire marketplace.

## First, read everything
Before modifying code:

1. Inspect the existing project and approved `/style-guide`.
2. Read every attached specification file in numeric order.
3. Treat the existing style guide as the visual source of truth.
4. Treat the attached locked decisions/specs as the product source of truth.
5. Do not replace or reset the existing project unless there is a genuine technical blocker.

## Then give me a short implementation plan
Before writing code, tell me:
- the current framework/stack you found;
- what you will keep from the approved style-guide implementation;
- the backend/database/auth architecture you propose;
- the domain/module structure;
- the first milestone files/routes you will create;
- any truly blocking technical decision.

Do not re-open already locked product decisions.

## After the plan, implement MILESTONE 1 ONLY

Milestone 1 is FOUNDATION.

Read especially:
- `00_START_HERE.md`
- `01_LOCKED_PRODUCT_DECISIONS.md`
- `02_TECH_ARCHITECTURE.md`
- `03_DATABASE_DOMAIN_MODEL.md`
- `04_CATALOG_PRICING_SEARCH.md`
- `16_IMPLEMENTATION_SEQUENCE.md`

### Build in Milestone 1
1. Preserve the approved TROC style guide and component system.
2. Organize the codebase into scalable domain modules.
3. Establish PostgreSQL/Supabase-oriented architecture.
4. Add migrations/schema for core entities.
5. Establish buyer authentication/account foundation.
6. Establish server-side roles/permissions for buyer, seller owner/member, admin, support and catalog moderator.
7. Create seller-account/application domain foundations without the full seller dashboard.
8. Ensure EN/FR architecture works throughout.
9. Preserve dark/light theme preference.
10. Create provider interfaces: CatalogProvider, PricingProvider, PaymentProvider, ShippingProvider, SearchProvider, EmailProvider, StorageProvider, FxProvider.
11. Create demo-data batch/provenance infrastructure.
12. Create initial test setup for domain rules/authorization.
13. Create/update `IMPLEMENTATION_STATUS.md` listing milestones/features as not started, in progress, implemented or blocked.

### Important restrictions
DO NOT yet build the full marketplace homepage, full catalog ingestion, Smart Cart, checkout, seller dashboard, collections, admin UI, real payments, Stripe, real KYC, Canada Post or public API.

DO NOT import/scrape a production TCG catalog until the data source/license is explicitly approved.

Use representative seed data only when needed for foundation testing.

### Architecture principles
TROC becomes the production product, not a disposable prototype.

Keep:
- money in integer cents;
- UTC timestamps;
- CAD launch currency;
- canonical TROC catalog IDs;
- external provider IDs as mappings only;
- provider-specific code behind adapters;
- server-side authorization;
- reusable domain services;
- auditability;
- scalability for large catalog/inventory datasets.

Most importantly, do not make foundation decisions that prevent TROC's low-value-singles model:
- very cheap listings;
- seller minimums;
- combined shipping;
- one buyer checkout across multiple sellers;
- Smart Cart consolidation;
- multi-card buying;
- master-set/wishlist matching.

## Use the approved UI
Any new UI must reuse the components/tokens already approved in `/style-guide`.

If a genuinely new reusable component is required:
1. build it consistently;
2. add it to `/style-guide`;
3. do not create isolated one-off styling.

## Completion
At the end of Milestone 1:
- run type checking;
- lint;
- tests;
- verify mobile behavior;
- verify EN/FR architecture;
- verify existing style guide is visually intact;
- update `IMPLEMENTATION_STATUS.md`;
- summarize changes;
- identify blockers/TODOs.

STOP after Milestone 1 and wait for my approval before Milestone 2.

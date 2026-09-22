# Initial Prompt — Additions to the Existing TROC Roadmap

I have added a new folder to the project containing additional `.5` milestones and documentation guidance for TROC.

IMPORTANT CONTEXT:
- Milestones 1, 2 and 3 are already complete.
- Do NOT restart them.
- Do NOT rewrite working functionality simply to match the new documents.
- The new milestones are additions to the existing roadmap, not a replacement roadmap.
- The first new implementation milestone is Milestone 3.5.

## Why these milestones were added

The existing roadmap focused primarily on building a functional marketplace. We now need the architecture and product strategy to explicitly address the two-sided marketplace cold-start problem and create long-term network effects.

### Seller strategy
TROC should NOT require an existing seller to manually recreate and independently maintain another inventory.

The long-term seller experience should be:

**Keep selling where you already sell. Add TROC as another Canadian sales channel with minimal additional work.**

We want frictionless bulk import and eventually live synchronization/integration with inventory systems and marketplaces such as SortSwift, CardUploader, eBay, Shopify, TCGplayer exports and future tools.

TROC should own a clean, documented seller/inventory API so third-party inventory systems can eventually treat TROC as another publishing/sales destination.

### Supply strategy
Marketplace liquidity is more important than vanity signup numbers.

We need to make it easy for a relatively small number of established sellers to bring large inventories to TROC. We also want a Founding Seller and qualified seller-referral system so early sellers help recruit other legitimate sellers and inventory.

Referral rewards must be based on meaningful activation/contribution, not empty account creation.

### Pre-launch strategy
We do not want to finish the entire marketplace and only then begin looking for users.

TROC should build separate Collector and Seller lists before public launch. The seller list should help us identify high-inventory sellers and compatible inventory-management systems. The collector list should establish early demand and eventually help us understand what Canadian buyers actually want.

The waitlist/growth experience may be deployed earlier than Milestone 6.5 if it can be safely isolated from unfinished marketplace functionality.

### Buyer moat
Once inventory is sufficient, inventory alone is not enough of a moat.

TROC should become particularly useful for Canadian buyers through:
- Wishlist/demand matching
- availability/price alerts
- Canadian seller inventory aggregation
- TROC Smart Cart
- optimization of total delivered basket cost, including shipping across sellers
- Canadian transaction-derived market data once sufficient real data exists
- collection → sell and wishlist → buy workflows

Smart Cart is especially important: it should optimize the whole delivered order rather than simply choosing the cheapest individual listing for every card.

### Data/network effects
Over time TROC can build defensibility through:
- seller network
- inventory integrations
- active Canadian inventory
- seller/buyer reputation
- wishlists
- Canadian demand data
- legitimate Canadian transaction history
- TROC CAD market data
- referral network
- Smart Cart optimization
- collections

These systems should reinforce one marketplace flywheel rather than exist as disconnected features.

## New files
Review the entire added folder before modifying code:
- README.md
- DOCS-STRUCTURE.md
- MILESTONE-3.5.md
- MILESTONE-4.5.md
- MILESTONE-5.5.md
- MILESTONE-6.5.md
- MILESTONE-7.5.md
- MILESTONE-8.5.md
- MILESTONE-9.5.md
- MILESTONE-10.5.md

## What I want you to do now

1. Read all of the new roadmap files.
2. Inspect the current repository and completed Milestones 1–3.
3. Determine how the new `.5` milestones fit into the existing roadmap without breaking or duplicating completed work.
4. Update the master roadmap/index so the new milestones appear in the correct order between existing milestones.
5. Create the internal `/docs` folder structure described in `DOCS-STRUCTURE.md` where appropriate. Do not fill documentation with fabricated implementation claims; use clear Planned/In development/Beta/Live statuses.
6. Check whether anything already built in Milestone 3 conflicts with Milestone 3.5, particularly canonical card/listing separation, inventory identifiers, external SKUs, source platform fields and future synchronization compatibility.
7. If there is a conflict, make the smallest safe architectural correction needed. Do not rebuild Milestone 3 unnecessarily.
8. Then implement **Milestone 3.5 only**.
9. At the end of Milestone 3.5, perform a full audit, review and optimization pass as specified in its file.
10. Fix all meaningful issues discovered by that audit before considering 3.5 complete.
11. Run all relevant tests/build checks and confirm the production deployment pipeline remains healthy.
12. Stop after Milestone 3.5 and provide a concise completion report. Do NOT automatically continue into Milestone 4 unless I explicitly tell you to continue.

## Important implementation principles

- Preserve working functionality.
- Prefer extending existing architecture over parallel duplicate systems.
- Do not prematurely build future milestones.
- Do not hard-code business rules that should be admin-configurable.
- Do not claim an integration or partnership exists unless it actually exists.
- Do not fabricate market prices, demand, transactions, savings, reviews or inventory.
- Treat inventory synchronization as reliability-critical.
- Design APIs/webhooks with authentication, authorization, idempotency, retries and observability in mind.
- Protect buyer/seller privacy.
- Keep the marketplace Canadian-first and CAD-first.
- Optimize for marketplace liquidity and transaction quality, not simply feature count.

The long-term seller principle is:

**Manage inventory once. Sell everywhere, including TROC.**

The long-term buyer principle is:

**Find the cards you want across Canadian sellers and intelligently minimize the total cost of getting them delivered.**

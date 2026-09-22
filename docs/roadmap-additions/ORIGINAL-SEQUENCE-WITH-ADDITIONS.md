# Implementation Sequence

Do not build everything in one pass.

Updated 2026-09-22: milestones 1–3 are complete for sequencing. Continue with
Milestone 3.5 only. The additions below extend this roadmap; they do not restart
earlier work. See `Troc-Milestone-3-5/docs/product/roadmap.md` for integration notes
and current implementation limits while the milestone checkout is active.

Milestone 0 — approved style guide — COMPLETE.

## Milestone 1: Foundation
Architecture, database, auth/roles, i18n persistence, provider interfaces, demo provenance, tests.
STOP.

## Milestone 2: Catalog + Public Marketplace
Catalog structure/import adapter, search, game/set/product pages, seller offer aggregation, public storefront, SEO.
STOP.

## Milestone 3: Low-Value Commerce
Cart, seller minimums, promotions, shipping, Smart Cart, simulated checkout, Marketplace/Seller Orders, fee/credit ledgers.
STOP.

## Milestone 3.5: Frictionless Seller Inventory & Integration-Ready Architecture
Implement/audit the canonical listing, inventory identity, manual listing, CSV import,
inventory management and event foundation specified in `MILESTONE-3.5.md`. Stop
after 3.5 verification. Milestone 4 reuses this work rather than duplicating it.

## Milestone 4: Seller Platform
Application/approval, dashboard, inventory, listing, CSV import, promotions, offers, storefront config, teams, analytics.
STOP.

## Milestone 4.5: TROC Seller API & Live-Sync Foundation
Planned. See `MILESTONE-4.5.md`.

## Milestone 5: Collector + Trust
Collection, master sets, want lists, wishlist, saved searches, alerts, follows, messages, reviews, condition guide, notifications.
STOP.

## Milestone 5.5: Founding Seller & Seller Referral System
Planned. See `MILESTONE-5.5.md`.

## Milestone 6: Admin + Demo + Leads + Future
Admin, correction queue, seed/purge, leads, buylist light, developers page, compliance scaffolding, analytics and final QA.
STOP.

## Milestone 6.5: Pre-Launch Buyer & Seller Growth System
Planned; may be isolated and deployed earlier with explicit direction. See `MILESTONE-6.5.md`.

## Later additive milestones
- 7.5 — Wishlist & Demand Network (`MILESTONE-7.5.md`).
- 8.5 — Smart Cart expansion (`MILESTONE-8.5.md`); extend existing Milestone 3 work.
- 9.5 — Canadian Market Data (`MILESTONE-9.5.md`).
- 10.5 — Collection → Marketplace Flywheel (`MILESTONE-10.5.md`).

All are Planned. The original pack defines no integer milestones 7–10; no scope
for those numbers is inferred.

At every stop:
- typecheck;
- lint;
- tests;
- mobile/desktop inspection;
- EN/FR inspection;
- update `IMPLEMENTATION_STATUS.md`;
- list deviations/TODOs;
- wait for approval.

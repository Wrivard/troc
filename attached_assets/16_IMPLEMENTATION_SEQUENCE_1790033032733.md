# Implementation Sequence

Do not build everything in one pass.

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

## Milestone 4: Seller Platform
Application/approval, dashboard, inventory, listing, CSV import, promotions, offers, storefront config, teams, analytics.
STOP.

## Milestone 5: Collector + Trust
Collection, master sets, want lists, wishlist, saved searches, alerts, follows, messages, reviews, condition guide, notifications.
STOP.

## Milestone 6: Admin + Demo + Leads + Future
Admin, correction queue, seed/purge, leads, buylist light, developers page, compliance scaffolding, analytics and final QA.
STOP.

At every stop:
- typecheck;
- lint;
- tests;
- mobile/desktop inspection;
- EN/FR inspection;
- update `IMPLEMENTATION_STATUS.md`;
- list deviations/TODOs;
- wait for approval.

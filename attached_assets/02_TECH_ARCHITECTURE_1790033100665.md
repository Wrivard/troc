# Technical Architecture

## Preserve the existing style-guide project
Do NOT re-scaffold the repository if the current approved style guide already runs successfully.

Use the current framework and component system.

Expected production-oriented direction:
- React;
- TypeScript;
- Next.js if the existing project uses it;
- PostgreSQL;
- Supabase-oriented backend for database/auth/storage;
- server-side authorization;
- route/server actions or API handlers with thin controllers;
- business logic in domain/services;
- translation files for EN/FR;
- semantic theme tokens from the approved style guide.

## Core module boundaries
Create clear modules for:
- auth/users;
- sellers;
- catalog;
- pricing;
- listings/inventory;
- search;
- shipping;
- promotions;
- cart;
- smart-cart;
- checkout;
- orders;
- payment simulation;
- fee ledger;
- credit/rewards;
- collections;
- want lists/wishlists;
- price alerts;
- storefronts;
- reviews;
- messages;
- notifications;
- offers;
- buylist;
- admin;
- demo data;
- real leads.

Do not put business logic inside React components.

## Provider interfaces
Create replaceable service interfaces for:
- CatalogProvider;
- PricingProvider;
- PaymentProvider;
- ShippingProvider;
- SearchProvider;
- EmailProvider;
- StorageProvider;
- FxProvider.

MVP implementations can be demo/local.

## Important implementation rules
- all money stored as integer cents;
- CAD launch currency;
- UTC timestamps;
- localized display;
- strong database constraints;
- server-side permissions;
- no secrets in client code;
- validation at boundaries;
- pagination for large lists;
- no N+1 query patterns;
- background jobs for heavy imports/notifications later;
- idempotency for order/import operations where relevant.

## Internationalization
All visible copy must be translation-ready.
EN/FR switch persists.
Do not duplicate whole pages for language.

## Themes
Reuse approved dark/light design system.
Do not redesign it.

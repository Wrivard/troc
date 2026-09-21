# TROC Style Guide — Single-File Master Specification

This file exists for tools with limited attachment counts. It summarizes the modular files in this pack.

TROC is Canada's trading card marketplace. Build only the design system and `/style-guide` first.

## Locked identity
- Name: TROC
- Descriptor: Canada's Trading Card Marketplace
- Primary line: Built here. For collectors here.
- Supporting: Collect. Trade. Belong. / More cards. Less shipping. / Sell cards. Keep more.
- Visual character: minimalist, premium, modern, fast, confident, Canadian, technology-forward.
- Palette: TROC Red ~#FF2D3D, near black #0E0E0E, dark greys, off-white #F4F4F4, white.
- Default theme: Canada Dark; also implement Canada Light.
- Selected wordmark: italic/forward TROC reference supplied as image.
- Leaf: custom TROC maple leaf eventually; supplied leaf is composition reference only and must not be treated as final or traced from Canada's official flag.

## Design rules
Use semantic tokens, reusable React/TypeScript components, responsive mobile-first layouts, EN/FR localization architecture, accessible states, subtle purposeful motion. Avoid rainbow styling, cartoon/gaming clichés, excessive gradients/glassmorphism, generic SaaS art and decorative maple-leaf overload. Let card art supply most secondary color.

## Required style-guide content
Brand overview; logo variants; colors; themes; typography; spacing/grid/radius/shadows; buttons/forms; search/navigation; marketplace product cards and seller rows; condition/variant/seller badges; price/ref-price UI; promotions; seller minimum/free shipping progress; cart group; Smart Cart savings; collection progress; tables/metrics; notifications/modals/drawers; empty/error/loading states; mobile previews; accessibility notes.

## Milestone boundary
Do not build catalog, seller dashboard, database, payments, orders or full homepage. A small static marketplace composition is allowed only to prove the visual system.

## Acceptance
The style guide must look close to the supplied approved brand board, work in dark/light and mobile, use centralized tokens, include all interactive states, and be ready to reuse in later marketplace milestones.

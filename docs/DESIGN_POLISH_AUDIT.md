# TROC MVP design / UX / brand polish — 2026-09-22

This is a presentation pass authorized after Milestone 3, not the start of Milestone 4. Existing business rules, permissions, SQL, provider approvals and simulation boundaries are unchanged. The supplied logo, palette, typography, semantic tokens and themes remain authoritative.

## A. Homepage

- Replaced the results-page opening with a bilingual headline, utility search, buyer/seller CTAs and a static perspective arrangement of three approved catalog images. No generated or newly scraped artwork, animation, canvas or 3D runtime.
- Sequence: hero → compact Canadian/CAD/bilingual/low-value positioning → browse games → curated discovery → three-step explanation → Smart Cart comparison → inexpensive singles → Canadian story → sample seller community → final CTA → full footer.
- Removed unsupported “trending” and empty “recently sold” sections. Demo selection is not presented as live traction. Featured cards and inexpensive picks are separated to reduce repetition.
- Smart Cart illustration uses the existing tested 30-card scenario: $14.25 to $11.22, three sellers to one, $7.50 to $4.00 shipping. It explicitly describes a demo example before tax, variable card prices and non-guaranteed savings.

## B. Page coverage

| Routes | Presentation and actual availability |
|---|---|
| `/` | New marketplace composition using approved imagery and components. |
| `/search` | Clear discovery intro, grouped filter disclosure, result count, improved spacing and useful no-results recovery. Search, filters and pagination remain functional. |
| `/games/[slug]` | Consistent game heading, introductory copy, relevant set links and card browsing. All five game routes reviewed; unavailable art keeps the existing fallback. |
| `/sets/[slug]` | Set-led heading, filter disclosure and a quieter collector/checklist callout. Collection tracking remains planned. |
| `/product/[slug]` | Framed full-card art, offer price first, distinct reference/median prices, accurate per-card offer labels, future collector actions behind disclosure, condition-guide link, corrected shipping copy. Chart is loaded separately. |
| `/store/[sellerSlug]` | Seller identity, location, handling/minimum/combined-shipping strip, inventory and filters, clearer about/review states. Fixed banner obscuring seller name; only avatar overlaps. No fabricated reviews or logos. |
| `/sell`, `/founding-sellers` | Bilingual seller/community positioning and the locked first-250 approved founding-seller proposition. Applications are explicitly not open. No lead form or new onboarding workflow. |
| `/about`, `/help`, `/condition-guide`, `/developers` | Purposeful bilingual editorial pages; useful shopping explanations and explicit API/demo/activation boundaries. No invented legal policy, support channel or launch date. |
| `/cart`, `/smart-cart`, `/checkout` | Shared header/footer, order navigation, concise intent copy, stronger headings, contained desktop-sticky totals; existing seller groups, minimum/promotion progress, locked listings and comparison kept intact. |
| `/order-confirmation/[id]` | Alias to the existing authorized buyer order view. It does not fabricate a successful order or bypass authorization. |
| `/account`, `/account/settings`, `/sign-in`, `/sign-up` | Shared marketplace identity, focused account panel and clearer copy. Auth activation limitation remains. |
| `/account/orders[/id]`, `/seller/orders[/id]` | Shared navigation, structured list surfaces, empty state and existing detail/fulfillment views. Real test checkout and seller shipping verified locally. |
| `/account/messages`, `/account/notifications`, `/account/wishlist`, `/account/price-alerts`, `/account/following`, `/account/credit` | Localized planned-state pages, not implemented dashboards. Existing order messages and checkout credit remain available only through their existing activated test flows. No fake inbox or credit balance. |
| `/collection[/game[/set]]`, `/want-lists[/id]` | Collector-oriented roadmap pages explaining planned organization and matching. No fake progress, ownership, saved list or collection backend. |
| `/seller`, `/seller/apply`, `/seller/inventory`, `/seller/promotions`, `/seller/offers`, `/seller/analytics`, `/seller/storefront`, `/seller/team`, `/seller/settings`, `/seller/plan`, `/seller/buylist` | Consistent, clearly labeled planned-state surfaces with working browsing/order navigation. Full seller platform remains not started. No fake KPIs or merchant operations. |
| Admin | No existing admin UI to polish; no admin scope added. |

## C. Brand and copy

Direct English and Canadian French copy prioritizes finding cards, comparing offers, grouping orders and supporting local collectors/shops. “Built here. For collectors here.” carries the Canadian story. New routes have localized titles. Demo notice, art rights, simulated checkout and planned tools remain explicit. No unapproved social URLs, legal pages or unsupported commercial guarantees were invented.

## D. Marketplace and trust

All important surfaces now share the same approved navigation and four-column footer. The logo always leads home. Footer destinations work and distinguish collection plans from active tools. Reference prices remain separate from actual seller offer prices. Demo sellers/stock/prices and the illustrative Smart Cart example are labeled. Seller metadata is surfaced without invented sales/review claims.

## E. Mobile and accessibility

The opt-in compact header retains all controls in three rows. Game discovery uses two columns on narrow screens; content sections stack naturally. Cart groups retain row pagination for large orders. Semantic headings, labeled search/forms, translated icon names, skip link, focus states and full-card alt text are preserved. The hero is static, including with reduced motion. Automated accessibility checks are evidence, not a certification.

## F. Reusable UI

- `CardShowcase` extends the existing product-presentation family: at most three supplied card nodes, translated figure label, static perspective, existing shadows/radii. Story includes three-card, missing-art and single-card states.
- `SiteHeader.compactMobile` extends existing navigation; opt-in, with its own story toggle. The default guide header is unchanged.
- Seller storefront family correction reserves the negative overlap for the avatar, keeping seller names readable below the banner.
- Marketplace header/footer and homepage sections are product compositions of existing primitives; they are not a parallel component library. No token values changed. Family records and guide documentation were updated.

## G. Verification

- Typecheck, lint, 59 domain/authorization tests and full workspace build.
- `tests/design-polish-browser.mjs`: 400 route checks, 50 routes × 390/768/1280/1920 × EN-dark/FR-light. Checks page landmarks, translations/theme, overflow, accessibility, loaded images on captured routes, runtime errors and hero search submission. Roadmap routes are tested as roadmap states, not as functioning features.
- `tests/commerce-browser.mjs`: 12 authenticated local flows across three widths, EN/FR, both themes: product → cart → Smart Cart → simulated checkout → buyer order → seller shipment. Assertions now scope to the main content because the footer also contains headings/links.
- 12 large-cart cases (5/20/50/100 lines at 390/768/1280), including seller-minimum recovery and discovery links, passed.
- 96 real-art route cases (eight routes × three widths × EN/FR × dark/light) passed after the final product and storefront changes.
- Exact Vercel production build passed. GitHub-triggered deployment and live smoke verification are reported in the task completion; hosted authentication remains unavailable.
- Eight standalone/integrated guide screenshots match; locale and theme persistence pass. Manual visual inspection covers home, product, seller storefront, account and checkout compositions. Existing guide tokens/default layout are retained; the documented additions are intentional.
- Main entry bundle reduced from approximately 637 KB / 188 KB gzip before chart splitting to 247 KB / 79 KB gzip. A separate approximately 388 KB chart bundle loads for product history. These are build sizes, not a measured Core Web Vitals score.
- Evidence: `verification/design-polish-browser.json`, `verification/commerce-browser.json`, `verification/commerce-large.json`, `verification/real-art-browser.json`, `verification/browser-results.json`. Screenshots and local logs remain ignored.

## H. Remaining limits / recommended next

1. Hosted authenticated checkout still needs the already-documented Supabase/database activation. This design pass does not configure credentials or claim hosted authenticated commerce works.
2. Seller branding is still neutral initials and fallback banners because real merchant assets are unavailable. Approved real seller identity assets would improve storefronts most.
3. Catalog breadth is intentionally bounded. One Piece/Riftbound keep fallbacks until suitable approved samples exist.
4. Planned account/collector/seller pages are honest navigation destinations, not full interfaces. Their final content density and workflows should be designed only within their approved feature milestones.
5. Live legal policies, real customer support and social destinations remain unpublished. The footer links useful current pages instead of dead or invented destinations.
6. Charts now load separately; further chart tuning should use measured production performance. No heavy hero media or animation was introduced.

Stop before unrelated product work or Milestone 4.

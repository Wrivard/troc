# Deeper platform pass: product, search and cart

2026-09-22. Design checkout based on A6d41f82 (merge1706cd8). Exact presentation grants recorded by A in the build-pack MILESTONE-REVIEWS/A/ACTIVE-OWNERSHIP.md. Platform only; A integrates and releases.

## Candidates and scope

- f58d542: DP01/DP02. Existing variant links now occupy an optional ProductPurchaseSummary selection slot before offer navigation. Selected state stays explicit. Price/action grouped; auxiliary offer filters use native disclosure and secondary Apply. Reference basis moved beside reference pricing. Source/generated DS CSS and editorial guide example updated together.
- c4af21a: DS01/DS02. Search query, sort and actions precede optional refinements; secondary heading identifies language/finish. Desktop images retain their ratio at bounded size. Mobile outer disclosure preserved; game/set/store forms retain their field order and handlers.
- 1b39a13: independent review found the query-chip case still pushed desktop prices below the fold. Search now omits redundant game navigation and puts heading/description on one line when space allows; Game remains in refinement controls. This fixes the measured case without further shrinking art.
- d862a55: DC01/DC02. Summary lists actual seller minimum shortfalls with focusable links to affected groups. SmartChanges compares source/proposed seller, printing metadata, condition and quoted unit price alongside existing quantity/difference. Calculations, eligibility, locks, substitutions and mutation handlers preserved.

## Author verification

Marketplace types and repository lint PASS. Final d862a55 client and SSR production builds PASS. Ten existing commerce/catalog-presentation tests PASS using direct node tsx invocation (pnpm exec could not resolve tsx). Database-labelled test uses local test infrastructure, not hosted readiness proof.

Browser approval service initially timed out, including after explicit user approval, then recovered. Inspected live in-app renders: FR dark product at desktop and390x844; selected Reverse through the actual link and observed summary/price update from0.05 to0.15; used CTA to focus offers and opened filter disclosure. Inspected loaded FR dark desktop search artwork, names/prices; also opened auditor137-search-1440-en-light-Pidgey.png for final query layout. Before renders inspected: auditor121-product-390-fr-light-top.png and125-search-1440-en-dark.png. Different theme/viewport samples are not pixel-equivalent comparisons; auditor29 retains the full comparable matrix.

FR dark cart/SmartCart at1440x900 and390x844: began with verified empty cart, added one demo Pidgey from Nord and Maple, inspected minimum reason and followed link; activeElement confirmed Maple seller group. Optimized demo quote and opened substitution details: Maple LP0.10 to Nord NM0.05, EN Standard#016, quantity1; totals and shipping remain separate. Removed Maple: reason disappeared and simulated checkout enabled. Removed remaining owned Nord line and verified empty cart restored. No checkout, order, application of optimized basket or remote mutation performed. In-app tool screenshots were viewed; independent auditor owns durable matched after-captures.

## Independent status and remaining work

UX-AUDIT/29-PRODUCT-SEARCH-REVALIDATION.md: DP01, DP02 and DS02 PASS; DS01 PASS on1b39a13 after c4af21a query failure retained as evidence135. Auditor137 matrix: desktop default prices776–824; Pidgey query838–886 at1440x900. Product matrix, real variant/filter changes, keyboard disclosure, zero-offer recovery and two scoped axe checks documented in29. These are scoped findings, not complete WCAG/platform certification.

DC01/DC02 d862a55 sent for independent retest; pending. Hosted Auth/checkout persistence and release readiness remain separate. Continue home/navigation and stores with auditor briefs, then account/seller/information states; do not reopen unchanged findings or manufacture cosmetic work. Product/search/cart source held stable during this retest. Unrelated generated inventory timing and dependency log excluded.

## Additional author observations

At unchanged application d862a55: FR dark homepage390x844 hero and next artwork/promise band visually inspected; search/browse/seller paths visible before hero artwork, no new issue established. Followed homepage Maple storefront link, inspected390x844 hero and used View cards to reach named/priced inventory; repeated catalog action at1440x900, no new issue established in these samples. Inspected FR dark sign-in and registration390x844 without submitting: persistent labels, password-length help and Canada checkbox visible. These samples are not independent certification of those sections. Inspected EN dark1440x900 style-guide editorial ProductPurchaseSummary example; approved shell and updated selection slot render coherently. Auditor29 is the independent product/search verdict; cart retest still pending.

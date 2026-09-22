# World-class design refinement — 2026-09-22

Status: implemented and deployed. Implementation commit `1d14f16` is live at https://troc-api-server-psi.vercel.app. No Milestone 4 scope was added.

## A. Before
The previous pass was functional but relied on repeated bordered containers, similar section weights, a static card fan and utilitarian page openings. The new composition preserves the approved logo, typeface, colors and underlying product behavior.

## B. Homepage
Distinct visual rhythms now separate a showroom hero, concise value rail, illustrated game tiles, a discovery edit, numbered explanation, shipping comparison, affordable-card edit, inverse-color Canadian narrative, regional store profiles and a closing buyer/seller invitation. Pokémon leads the game ordering. Curation is labelled as demo content rather than invented trending activity.

## C. Hero
Real approved Bulbasaur artwork is the largest foreground card; Magic and Yu-Gi-Oh! sit behind it. Perspective, a subdued elliptical plinth, directional atmosphere and a restrained entrance give depth. The headline remains “One search. Every seller.” Search submits to the working catalog. CAD and Canadian positioning remain explicit.

## D. Brand
Short red eyebrow rules, disciplined labels, fine dividers, consistent 1.5-stroke iconography and the approved compact TROC mark add identity. No palette or font tokens changed. The new editorial primitives and showroom option are demonstrated in `/style-guide#page=editorial`.

## E. Internal pages
Search now groups printing/condition/price refinements behind a native disclosure that opens automatically when active. Shared editorial intros unify search, games, sets, products, stores, information, planned tools, account, cart, Smart Cart and checkout. Product art has a dedicated tray, price groups have a clear accent, seller offers have an introductory hierarchy and price history has contextual framing. Store banners use their own catalog imagery when no seller banner exists. Store tabs, identity and inventory remain functional. Information pages gain numbered chapters; founding sellers gets a factual 250-place callout; collection pages show an explicitly planned binder concept.

## F. Footer
A larger approved wordmark anchors a separate editorial masthead, followed by four navigation groups. Country/currency/languages, demo explanation and artwork/payment notices remain readable and distinct. All links preserve language; the logo returns home.

## G. Motion and images
CSS perspective and bounded mouse tilt create depth without WebGL, a new dependency or an animation loop. Reduced-motion preference disables entrance animation, transitions and mouse parallax. Touch scrolling never drives tilt. Existing responsive approved art remains the only card imagery; no production scrape, invented seller photography or additional catalog import.

## H. Hierarchy
Hero copy, page introductions, section titles, body text, metadata and disclosures have different roles. Smart Cart highlights $3.50 less shipping and $3.03 total savings for the tested 30-card example; these are deliberately distinct. Unframed card grids alternate with stronger narrative surfaces.

## I. Mobile
Hero content and display stack, game tiles rebalance, proof columns retain readable totals, editorial splits collapse and footer navigation becomes two columns. The EN/FR copy and long French labels are included in responsive checks. Existing compact mobile navigation and persistent preferences are preserved.

## J. Remaining limitations
Demo stores and prices remain fictional, and their limited content constrains how alive the community can feel. One Piece/Riftbound retain honest fallback visuals because additional art is not approved. Hosted buyer authentication/checkout activation still needs the existing Supabase/database setup; this pass does not add live payments or new feature scope. Planned collector/seller workspaces remain planned. More varied licensed imagery and real seller-provided branding are future content work.

## K. Verification
Completed: type checking, lint, 59 domain tests, workspace build, 400 responsive route checks (50 routes × four widths × EN/dark and FR/light), 96 artwork checks (both languages and both themes), 12 full commerce flow cases and 12 large-cart cases. Also passed: 8 focused lead-card/motion/grouped-filter/guide accessibility cases, 8 preference and standalone/integrated guide comparisons (identical screenshots), and the final Vercel production build. The existing guide navigation numbers had their opacity removed to meet contrast without changing palette or layout.

Vercel reported deployment success for `1d14f16`. Live checks passed on 20 route/viewport/language/theme combinations with no page errors, overflow, failed hero images or detected WCAG A/AA violations. The homepage does not load the chart bundle. Live cart/Smart Cart checks passed at 390/768/1280 pixels; authenticated checkout correctly remains unavailable.

Evidence: `verification/design-refinement-responsive.json`, `verification/design-refinement-browser.json`, `verification/design-refinement-live.json`, existing artwork/commerce evidence, and local screenshots under `verification/`. Visual review covered the homepage from hero through footer, mobile product art/prices, desktop search and store, tablet collection/cart and founding-seller pages. Automated coverage checks all 50 routed page states; it is not a substitute for a human aesthetic review of every populated future state.

# D36 roadmap reference — frozen candidate handoff

2026-09-23. Priority scope after D34 reconciliation. D34 rejected write never executed; no condition-guide module or InformationPages changes existed at resume. Existing reference and both supplied leaf assets actually inspected. Originals retained, optimized alpha WebP derivatives960square/96×83;244674/3644bytes. Exact hashes in module assets/PROVENANCE.json. Existing page-grain asset reused.

## Route discovery / lease

No /roadmap public route/component existed in Design or A: only docs/product/roadmap.md and unused roadmap CSS class. Existing main dispatcher uses isInformationPage metadata. Orchestrator explicitly authorized minimal InformationPages registration/render seam and SiteChrome footer link in Design only after A response remained pending. Shared behavior/main/router/API/auth/cart/homepage unchanged. Do not add duplicate harness or disconnected demo.

## Factual phase mapping

Visual phases are editorial groups, not new milestones or strict execution ordering. In particular early6.5 work was explicitly authorized before later dependencies. The first two groups use checkmarks only for local implemented subfeatures; neither status nor checks assert hosted/production availability. Current phase is3 (not placeholder reference phase1). Correct sequential phase labels1–6 replace reference duplicatePHASE2. No live label, launch date, invented percentage, reward or unproven shipped milestone.

| Phase | Source milestones | Public status and rationale |
|---|---|---|
|1 Foundations|0,1,2,2.5|Implemented locally: approved design system, canonical IDs, ENFR, bounded sample. Preserve provider/licensing/hosted gates.|
|2 Cards into orders|3,3.5|Implemented locally: multisellercart/deliveredcomparison/simulatedcheckout/CSVtools. Historical3.5appdeployment documented, current authenticated hostedactivation stillpending.|
|3 Prepare for launch|4,6,6.5|In development: bounded seller/prelaunch work exists, broader scope/readiness incomplete. No completion checks for whole-workspace/hostedauth/release.|
|4 Connect sellers|4.5,5.5|Planned: sellerAPI/live-sync/webhooks and configured qualification/referrals. No public integration or foreverperk claim.|
|5 Collect with intent|5,7.5,8.5|Planned: collection/trust/wishlist/demand/alerts and SmartCart expansion. Does not mislabel existing milestone3SmartCart as entirely unimplemented.|
|6 Learn and grow|9.5,10.5|Planned: eligibletransaction-based Canadianmarketdata and collection→marketplace flow. No invented integer7–10 milestones.|

Sources read:16_IMPLEMENTATION_SEQUENCE.md; docs/product/roadmap.md; MASTER-CHECKLIST; PROJECT-DASHBOARD; MILESTONE-REVIEWS/C/ROADMAP-GAP-MATRIX.md (its known audit caveats retained); currentacceptedfrozenDesign/A work. Root specs define scope, not delivery evidence. Snapshot explicitly datedSeptember23,2026; later milestones require status maintenance by integrator.

CTA Follow our journey links to the supported About/story page and has explicit Discover the story helper. No signup/subscription/notification promise or fake success. Brand leaves are decorative, noninteractive; smallleafusedonlysignature, not logo replacement.

## Final author evidence / exact integration

Actual route /roadmap uses existing InformationPages dispatcher/header/footer (no main.tsx or API change). Shared diff is25addedlines in InformationPages: import, metadata key, dedicated render after existing hooks; one localized About-group footerlink in SiteChrome. Preserve all divergent A searchSlot/controller and otherpage hunks. No other InformationPages content or SiteChrome handler changed. New component/CSS/content/assets, test and this doc complete the candidate. Footerlink makes the page discoverable. Existing information-page CSR behavior preserved; no new SSR/SEO guarantee.

## Snake-layout correction (supersedes initial b7eb9af geometry)

Desktop at >=1200px uses four columns: phases 1–4 left to right, then phase 5 below 4, phase 6 and More to come moving left. The partial second row is right-aligned. Widths 601–1199px use a two-column alternating snake. At <=600px the original chronological DOM becomes a single vertical rail. Explicit CSS grid positions preserve the data array and keyboard order.

A decorative SVG connects measured marker centers. ResizeObserver observes the wrapper and individual cards; font readiness and locale changes trigger remeasurement. Row turns run along the outside edge with clearance from card interiors. The segment preceding phase 3 is red; the final segment is dashed. Content, factual statuses, supplied assets, CTA and shared route seams remain unchanged.

Correction scope: RoadmapPage.tsx, roadmap.css, tests/roadmap-reference-preview.mjs and this handoff only. Preserve unrelated dirty homepage/hero files and A's divergent SiteHeader searchSlot/controller seams. Integrate initial b7eb9af selectively before this correction if absent; do not accept the original seven-column layout.

Verification: marketplace typecheck PASS; scoped ESLint PASS; corrected client build PASS (2563 modules) into verification/roadmap-client. Original SSR build PASS before the layout correction; no new SSR-specific behavior introduced, but corrected SSR build not rerun. Existing port 4313 reused, no new harness server.

Twelve actual route cases PASS: 1440 EN dark, 1440 FR dark, 1672 EN dark, 2540 FR light, 768 FR light, 1024 EN dark, 320 FR light, 390 EN dark, and boundary widths 600 FR light / 601 FR dark / 1199 FR light / 1200 FR dark. Assertions cover row counts and snake direction, aligned turns, six marker-to-marker segments, no connector/card-interior intersections, one h1, seven ordered items, one current step, eight local-only checkmarks, loaded assets, no horizontal overflow, localized links, keyboard focus and About navigation. Twelve scoped axe scans have zero violations. Results: verification/roadmap-responsive.json.

Additional live resize 1440 -> 768 -> 320 -> 1200 PASS: all six path endpoints remain aligned with current marker centers. verification/roadmap-clean-capture.mjs captures full-page images from scroll zero before cropping, avoiding sticky-header contamination in earlier element screenshots. A first harness wait incorrectly required a zero-height horizontal SVG path to be visible; changed to attached plus endpoint polling. No application failure inferred from that capture error.

Actually inspected correction evidence: verification/roadmap-clean-1440.jpg shows complete right-edge turn and right-aligned partial row; verification/roadmap-clean-768.jpg shows alternating two-column turns; verification/roadmap-clean-320.jpg shows continuous mobile rail. Earlier roadmap-return element captures had sticky-header overlays and are superseded. Original reference/asset/heading/CTA inspections remain documented in the initial candidate history. Near-black canvas remains intentional in both themes. Existing test matrices cover static variable heights from French wrapping; live synthetic content-height mutation has not been tested.

Real 200% browser zoom remains UNVERIFIED: Control+Equal in headless Chrome left innerWidth/dpr/visualViewport.scale unchanged (verification/roadmap-zoom-attempt.json). Viewport resizing is not a substitute. Physical touch, screen-reader and cross-engine checks remain unverified. UX2 must independently review this corrected exact candidate, including real zoom if available. Local checks do not confer acceptance, integration, GitHub delivery or launch readiness.

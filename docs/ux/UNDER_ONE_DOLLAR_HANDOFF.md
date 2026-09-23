# Under-$1 shelf reference refinement

2026-09-23. Base 19eeacd. Design1 presentation only; A integrates/pushes/deploys.

Read full UNDER-ONE-DOLLAR-REFERENCE-BRIEF.md and actually inspected supplied f582b2de reference. Existing data selection and MarketplaceProductCard projection retained: Bulbasaur, Gloom, Spearow, Akki Ronin in current demo. No hardcoded catalog values, asset changes, controller edits or new routes.

## Implementation

Opt-in troc-editorial-catalog--shelf composition in shared design-system CSS, shown in /style-guide#page=editorial. Homepage passes a presentation hint through its existing cards renderer; other grids unchanged. Neutral token-based bordered surfaces, dominant contained art, bold names/prices, divider above price, restrained circular decorative arrow, four desktop/two tablet/one mobile columns. Existing whole-card link remains the sole focus target. EN/FR, light/dark preferences and reduced motion retained. Header uses existing EditorialIntro/eyebrow/link.

## Verification

Marketplace typecheck PASS. Workspace lint PASS after correcting four test-global lint errors. Client and SSR builds PASS, including final border refinement. git diff --check PASS (line-ending notices only).

Captured original built-preview EN/FR card text, href, src and srcset before rebuilding; final eight cases exactly match those original snapshots. tests/shelf-reference-preview.mjs verifies 1672 EN dark,1440 FR light,1100 FR dark,1099 EN light,834 EN dark,600 FR light,390 FR dark,320 EN light. Four cards, loaded images, expected column count, equal row heights/aligned price positions, no horizontal overflow, each link keyboard focus, contain sizing and localized under-$1 route parameters PASS. Desktop Enter navigates to the real product URL with populated h1. Evidence verification/shelf-reference.json; before snapshots shelf-baseline-en/fr.json are local evidence. To repeat data-preservation testing on a new baseline, run --baseline before changes then rebuild and run normally; do not overwrite current baseline to claim unchanged source data.

Actually inspected initial desktop1672 EN dark,tablet834 EN dark,mobile390 FR dark. Softened borders after inspection; final desktop1672 EN dark and1440 FR light inspected. Other final responsive screenshots captured/measured, not visually inspected anew. Actual /style-guide shared shelf render inspected (shelf-style-guide.jpg), including no-offer state. Original reference was inspected via in-memory JPEG conversion; originals unchanged. No full style-guide visual recertification or actual 200% zoom claim.

Known separate defect: Akki Ronin and style-guide Lightning Bolt retain original white corner wedges. Shared CardImage diagnosis/fix is the next exclusive lot; no asset crop/whitening workaround introduced here. Independent UX1 reference/journey review pending. No release/production-readiness claim.

Preview listeners observed4313 PID32640,5313 PID25836; no restart. Unrelated inventory-scale.json/logs/evidence preserved and excluded. Normal exec H016 persists; narrowly approved elevated operations succeeded. Recovery P003 released before implementation.

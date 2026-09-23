# Smart Cart education gap handoff

2026-09-23. Design-owned isolated candidate; independent acceptance pending. Base HEAD 2d8a673. No live feature-page, homepage, controller, optimizer or shared design-system edits.

## Audit and bounded change

The delivered 11f699c full page already explains shipping consolidation, illustrated comparison, proposal review and fixed-budget buying (independent review PAIR-2/12). Preserve it and its 1425-versus-1122 comparison. Its collection mode changes explanatory copy but does not show owned/missing cards or let a visitor select missing cards.

The new SmartCartCollectionExercise fills only that educational gap: four-card excerpt, one simulated owned card, visibly grey missing cards, keyboard selection, budget slider, illustrative cheapest-first selection, delivered total, over-budget feedback and reset. EN/FR and both approved themes are supported. Existing DS components are composed; no new primitive or style-guide redesign is needed.

## Selective integration for A

Copy only modules/brand/smart-cart-education/SmartCartCollectionExercise.tsx and its scoped CSS, plus the bounded fixture if appropriate. Do not ship the harness/baseline. Existing SmartCartFeaturePage may receive an optional `collectionExercise?: ReactNode` prop, destructure it, and render `{collectionExercise}` immediately before `.troc-scf-review`. Pass the component with locale, localized setTitle, and fixture cards mapped to localized names. The exact working composition is harness/main.tsx; prepare.mjs demonstrates the three slot edits against 11f699c. Preserve every existing handler, comparisonDemo and route. Reconcile the current A baseline selectively.

No integration has been performed by Design. Real-cart task priority, navigation/controller behavior, optimizer/quote correctness and actual collection matching remain their separate gates. This demo does not close those product requirements.

## Author evidence

- Marketplace TypeScript: PASS.
- Scoped ESLint on component/harness/test: PASS after qualifying browser storage globals.
- Isolated Vite production build: PASS (1717 modules).
- tests/smart-cart-education-preview.mjs: PASS at 1440 EN dark, 834 FR light, 390 EN light, 320 FR dark, reduced motion enabled.
- Native keyboard choose/checkbox/range Home/End/reset, totals 420/495/0/495 cents, 45-cent overage, disabled owned card, all artwork loaded, one page h1, no horizontal overflow: PASS.
- Scoped axe: zero violations in all four cases. Zero write requests and unchanged local/session storage.
- Evidence: verification/smart-education.json and four matching JPEGs. Actually visually inspected: smart-education-1440-en-dark.jpg and smart-education-320-fr-dark.jpg. The other two are captured only. Readable four-column desktop/two-column narrow layout; grey missing artwork and budget controls verified visually.

No physical touch, screen-reader, real 200% zoom, cross-engine, live integration or production claim. Tests are author evidence, not independent approval. Existing approved style-guide source is untouched; this isolated build does not prove the entire live guide regression.

## Review and delivery

Owned preview 4316, exec session69356; start/preparation commands and fixture provenance are in the module README. Review only this extension and its slot in the frozen full page. Preserve coordinator hero/HomeSections/assets and all unrelated dirty files. No push/deploy under the current coordination gate. A owns selective integration after independent review.

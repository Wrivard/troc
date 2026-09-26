# Storefront editor refinement — 2026-09-24

Local solo implementation and focused QA; no production or independent-review certification.

## Reviewed flow and changes
- Existing editor was stacked: the description form occupied the opening viewport while its preview sat below. Reorganized appearance and description into one editing column alongside a sticky preview; retained grain, colors and shared controls. On narrow screens, a sticky section navigator links directly to images, story and preview.
- Added upload thumbnails, distinct image-removal labels, 44px preview/control targets, independent EN/FR preview selection, softer scoped borders and clearer spacing. Desktop/mobile banner framing remains 5:2/16:9, regardless of the actual device width.
- Artwork saving stays beside artwork controls, with explicit browser-only scope and accurate clean/dirty status. Description publishing retains its own action and version-aware API. Corrected misleading copy: both languages publish in the same request.
- Permission-load failures now offer retry; permission-denied states are explained. Description initial loading has a placeholder and hides the unavailable fields. Edited text clears stale success feedback. Logo conversion bounds both dimensions to 400px rather than only width.

## Verification
- Frontend typecheck, scoped ESLint and client/SSR builds passed.
- check-storefront-editor.cjs: 1440 EN dark, 390 FR light, 320 EN dark, 820 FR dark; actual theme selected through header and verified using data-theme. Live text preview, independent preview language, intercepted503 retaining edits, no overflow, touch target sizes and section navigation. Isolated permission503 retry and read-only description checks.
- check-storefront-framing.cjs: EN1440/FR390 upload, original banner bytes, keyboard crop/zoom, local save/reload, discard, quota failure retaining edits, undersized image rejection, mobile ratio and overflow pass.
- check-store-description.cjs: real local fixture publish/reload plus intercepted409 preservation pass. Original fixture descriptions restored in finally.
- Actually inspected before screenshot (.local/storefront-before.png), final opening desktop and mobile screenshots, plus initial full-page captures. Full-page screenshots taken while scrolled displaced sticky chrome in the capture; switched final evidence to viewport screenshots at scrollY0. This was a capture artifact, not an application-layout finding.

## Evidence / limits
Source: StorefrontEditor.tsx, StoreDescriptionEditor.tsx, storefront-editor.css under artifacts/marketplace/src/modules/seller-platform. Browser evidence: docs/evidence/storefront-editor/check.json and viewport PNGs. Existing regressions: docs/evidence/storefront/framing-check.json. Build: .local/storefront-editor-build.log.
No new artwork publishing backend, cloud upload or CDN was added: artwork is explicitly browser-local; descriptions use the existing API. No live customer writes, deployments or account changes. No screen-reader or user-study claims. Blank preview artwork is intentional until the seller chooses images; no invented catalogue/listing content was added. Large-image browser quota remains a recoverable limitation rather than falsely claiming durable cloud storage.
Tool recovery: two mistyped working directories and a read-path/count typo failed before changes; corrected locally. Test theme assertion was corrected from dark to the observed troc-dark/troc-light attributes. No unrelated process/task was resumed.

Next: user review of the refined editor; media-publishing storage contract remains separately gated. Resume existing checklist D04/D06 reference reconciliation after this requested refinement.

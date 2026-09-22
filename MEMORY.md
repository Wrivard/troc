# TROC shared working memory

Updated: 2026-09-22. This note preserves context across conversations using this project. Update it when scope, decisions, or verified progress changes. Do not record credentials here.

## Current checkpoint — staging authorized, release held

Latest fixes: order O01/O02 committed `4baa958`; scoped source diff exactly matches UX report23's independently passed hash852EEA40876D5473666FC05FFAFC47654165F25094902B0F7E70670E415D9D1C. Failed message submissions preserve drafts, confirmed sends clear only unchanged submitted text, order read recovery never repeats a POST, and sign-in is reserved for401. D found P1 readiness false PASS for effective table ownership in `a704e59`; A reproduced it and fixed it in `4d982e7`, rejecting relation/schema ownership through membership and reachable elevated roles. Six focused local tests/lint pass; D exact-candidate retest pending. Hosted runtime/TLS/Auth gates remain blocked, and these fixes do not authorize release. Earlier approval timeouts are historical: both commits are now saved.

Public continuation integrated: Design evidence `83f6412` / code `8c338e7` merged cleanly with A diagnostics into `a7e7539`. Combined104tests/typecheck/lint pass. Independent UX report16 also closes public error h1/loading and shared-search/style-guide support checks within its recorded scope. Final integration build passed; complementary seller visual review uses A's isolated PGlite/fixture preview3015/5185, not hosted Auth. Public presentation ownership has returned to A; later findings require coordination. D's diagnostics review remains pending setup release, not falsely passed. Recovery/retention/concurrency assignments continue separately.

Current readiness work continues locally while connection/Auth prerequisites are pending. A `a704e59` implements operator-side single-connection read-only staging diagnostics and privacy-preserving request/error summaries; 104 tests, typecheck and lint pass, independent D review pending. B owns staging-recovery tooling/runbook, C staging-retention dry-run tooling/runbook, D staging-concurrency harness; each has exclusive scripts/tests/docs paths with the corresponding prefix. B↔C review each other; C reviews D; D reviews A. A alone schedules remote fixture windows and integrates releases. No remote restore/delete/load window is authorized yet. Design additionally owns only fallback JSX/imports in PublicClient.tsx for error/loading presentation, preserving fetch/state/retry behavior. See live root COORDINATION.md for task IDs and ongoing handoffs.

Current user correction: continue design/audit of all remaining existing public sections; do not idle after each handoff. Hosted database/Auth readiness blocks release and new engineering milestones, not ongoing public presentation improvements. Historical “design complete” statements describe earlier passes only. Design and UX resume homepage/navigation/footer, games/sets, information pages and remaining available store/planned surfaces from integrated baseline `63fb4fc` (application `43b32b5`), using Design's own preview4313/5313. A transferred presentation ownership of brand HomeSections/CatalogPreview/SiteChrome/InformationPages, catalog PublicMarketplace, marketplace.css, DS site-navigation/marketplace-compositions and corresponding CSS/docs, plus Design UX tests/docs. A avoids overlapping edits until explicit handback. Contracts/auth/commerce logic, B/C modules, schema, packages and deployment remain outside this design transfer. Further shared DS files require exact coordination. Independent section retests and serialized integration remain required; no production activation implied.

Independent review closure: B engineering and UX auditor both passed exact application `43b32b5`. B verified 825 source mappings, both SQL paths, six metadata render cases and unchanged quote calculations. UX inspected ten real/response-fixture renders at EN/FR 390/1440, with correct translated/missing/unknown metadata and no overflow; see parent `UX-AUDIT/11-CART-METADATA-43b32b5.md`. This closes the observed C01 cart gap, not hosted Auth/database/operations gates. A's review preview is released after this checkpoint.

Integration update: B `9cfbd01` and Design `5885b6b` merged cleanly into `1a30893`. Account/team helper `d7649dc` independently passed C's 8-case V02 review. A `43b32b5` adds source-derived variant key/collector number to cart quotes and readable cart metadata; independent engineering/visual reviews passed. Combined 99 tests, typecheck, lint and full build pass. Browser evidence: 40 seller cases, 40 public design cases, 2 account-ID response fixtures and 4 native-navigation cases; the final cart addition passed 8 responsive/accessibility cases with exact collector-number assertions. Real hosted Auth is still unverified. SSR smoke no longer assumes a bundler filename prefix and checks the stylesheet exists in deployment output. No release or main push.

This section supersedes historical pending statements below. The user authorized empty Supabase project `wcpsyflzqaeorxaejaqh` for staging. A alone coordinates schema/configuration and bounded test windows. Reviewed migrations 0001–0011 are applied with canonical LF checksums; existing platform security and migration history are preserved. All 67 application tables have RLS. Security advisor warnings are cleared after 0011; 15 informational default-deny tables remain intentionally restricted. No production deployment or activation is authorized by this staging setup.

Combined candidate `dfd58eb` passed independent B/C local reviews and 98 tests. A followups: `054c3a0` inventory failure copy independently passed UX review; `2fcc2eb` adds portable checksum verification and additive runtime hardening, independently passed B review and 99 local tests. Seller UX `9cfbd01` and Design `5885b6b` are integrated and reviewed; later public design refinements continue separately. Read the live parent COORDINATION.md for dispatch holds and ownership before assigning work.

Real application PostgreSQL/auth/concurrency gates remain BLOCKED. The direct database endpoint resolves IPv6 but is unreachable from this host; a verified session-pooler endpoint is needed. No dedicated runtime LOGIN or confirmed Auth test users exist yet. Ignored `.env.staging` has staging public configuration and a local signing key; never copy its contents into notes or logs. MCP SQL access is not runtime-role or connection-pool evidence. Main remains `512a37e`; no subsequent code has been pushed or deployed.

## Previous combined candidate — historical local review

Seller fixes1be237f and growth fixesb85c786 are now combined in A's isolated checkout. Growth is wired behind explicit default-off PRELAUNCH_ENABLED/PRELAUNCH_SCHEMA_READY and existing server auth/database/signing prerequisites.97combined tests,lint,typecheck,fullbuild and bundledSSR pass; 40integrated growth responsive/axe cases,16capture/withdrawflows and EN/FR consent-journey checks pass. Independent reviews closed seller C01–C04 and growth B01–B04 locally; C05 seller/team pagination remains B-owned and must pass C retest. A's verified identity/transaction adapter is shared without changing its behavior. No production activation or release; main remains512a37e. Review evidence lives in parent MILESTONE-REVIEWS.

## Mandatory review gate and current integration — 2026-09-22

The user now requires deep reciprocal milestone reviews, fixes, independent retests, realistic stress/recovery evidence and all readiness criteria before release or any next milestone. A holds B/C releases. B reviews C and A's integration; C reviews B including integration fixes; A reviews combined contracts/migrations/3.5 compatibility. Reports live in the build-pack MILESTONE-REVIEWS/{A,B,C}/. Read the latest docs/COORDINATION.md or live parent copy before acting.

Bounded seller Milestone 4 is locally wired in A's isolated checkout: application, manual admin review, dashboard and owner-only team pages. Source handoff258fb92 is integrated with legacy-application compatibility, reduced grants and submission rate-limit ordering fixes. Independent reviews remain pending. Full milestone4 is not complete. No B/C main push, production migration or deployment has occurred. Final main remains512a37e.

Hosted authentication/database activation and representative PostgreSQL stress evidence are BLOCKED, not passed. PGlite functional tests and test-only identities do not establish production readiness. Do not silently substitute a disabled-code release for these mandatory gates. The new design/audit pass runs separately in Troc-UX-Design and UX-AUDIT; A serializes all integration.

## Latest checkpoint — concurrent Milestone 3.5 work

Latest authorization: the user explicitly asked to start later work where dependencies allow. Orchestrator `01a0c9c3-7aec-7f60-b187-f2c1fefd2db9` assigned bounded Milestone 4 seller work to `01a0c9c6-b40a-77c3-8757-22ff6dbf93fd` in `Troc-Milestone-4-Seller`, and isolated early 6.5 growth work to `01a0c9c6-db14-7200-a837-1feede59dbab` in `Troc-Growth`. Those worktrees started at `f4b830e`; they must update to the final design+3.5 release before final verification. Migration 0009 belongs to seller work, 0010 to growth. This task remains the milestone integrator, one track at a time; neither new task may push main, deploy or migrate production. This supersedes historical stop-after-3.5 language only for those bounded assignments. See docs/COORDINATION.md for details.

- The user authorized Milestone 3.5 alongside the other conversation's design work. Ownership was acknowledged in both tasks. Milestone task: `01a0c994-3aa1-7700-9d47-040948c4bdfa`; design task: `01a0c68d-0c6c-7141-b324-bb4a6f618553`.
- Milestone 3.5 is implemented/audited and the combined application release `e8b8b9209a5bd576376ba8f5c3331a62d6c3a574` is deployed successfully. Checks: 70 domain/database tests, 13 inventory browser cases, type checking, lint, production builds, bundled SSR smoke and 20 live page checks. See `docs/MILESTONE_3_5_AUDIT.md` for evidence and limits.
- Final design code `9f4f58e` and evidence `e236c29` are included without overwriting design changes. The design task is complete and released its deployment window. The main `Troc-Brand-System` checkout was fast-forwarded; unrelated local outputs, .config and the retained-spec deletion were preserved. Earlier shared-note files were backed up under `../shared-notes-before-integration/`.
- Hosted database/auth activation remains blocked by existing configuration. Migration 0008 must be applied before inventory activation. Source labels are not live integrations. This task's implementation stops at 3.5; bounded later tasks require separate integration and verification.
- Earlier text below preserves the original request and initial checkpoint; the latest checkpoint supersedes its pending-work statements.

## Original direction and initial checkpoint (historical)

The user has now authorized working on Milestone 3.5 alongside the other conversation's page design work. See `../COORDINATION.md` for ownership and integration rules. Milestone work uses `../Troc-Milestone-3-5/`, isolated from this design checkout. The design task acknowledged the split and reports its current design work complete, with no further pushes planned. Milestone implementation and verification remain pending.

The user supplied “Initial Prompt — Additions to the Existing TROC Roadmap” and asked this conversation to save shared memory. The original is `../INITIAL-PROMPT.md`; durable copies of the prompt, milestone specifications and documentation guidance are retained in `docs/roadmap-additions/`.

Milestones 1, 2, and 3 are complete for purposes of sequencing, per the user. Do not restart them or rewrite working functionality to match new documents. The `.5` milestones supplement the existing roadmap. The next implementation milestone is **3.5 only**. Stop after its audit, fixes, verification, and completion report; do not proceed to Milestone 4 without explicit instruction.

This conversation added memory and discovery pointers only. It has not implemented Milestone 3.5, integrated the roadmap, performed its audit, or verified a deployment.

## Existing evidence and limits

- `IMPLEMENTATION_STATUS.md` records the existing foundation, catalog, marketplace, approved design work, and locally implemented Milestone 3 commerce. Consult its current sections and linked audit reports before changing code; older sections contain historical status statements.
- User completion of earlier milestones does not mean every hosted service is activated. Existing records distinguish local implementation from hosted authenticated checkout/database activation and licensed production catalog blockers.
- The latest design refinement entry reports successful local checks and a verified Vercel deployment for commit `1d14f16`. That is prior documented evidence, not verification performed by this conversation.
- Preserve the approved style guide, logo, typography, palette, working commerce, EN/FR support, theme preferences, and canonical identifiers.

## Next implementation work

1. Read the entire added roadmap set: `../README.md`, `../README-2.md`, `../DOCS-STRUCTURE.md`, and milestones 3.5 through 10.5, together with `../INITIAL-PROMPT.md`.
2. Inspect the actual repository and completed Milestones 1–3. Integrate the additions into the master roadmap in the correct order and create appropriate internal documentation structure with truthful Planned / In development / Beta / Live statuses.
3. Audit canonical cards versus seller listings, inventory identifiers, external SKUs, source fields, and synchronization compatibility. Correct conflicts with the smallest safe extension.
4. Implement only `../MILESTONE-3.5.md`: integration-ready inventory fields, structured manual listing, CSV mapping/matching/validation/review/preview/publish, scalable inventory management, retryable/idempotent inventory event concepts, and architecture/import/sync documentation.
5. Audit 100, 1,000, and 10,000+ row imports, duplicate and ambiguous matching, authorization/RLS, bulk safety, indexes/performance, canonical duplication, and future API compatibility. Fix meaningful findings; run relevant tests/builds and verify the actual production deployment pipeline before claiming success.

## Product principles

- Canadian-first and CAD-first. Optimize marketplace liquidity and transaction quality.
- Seller principle: **Manage inventory once. Sell everywhere, including TROC.** Prepare for existing inventory tools and sales channels without claiming integrations or partnerships exist.
- Buyer principle: find cards across Canadian sellers and minimize total delivered basket cost, including shipping across sellers. Preserve and extend existing Smart Cart work.
- Future additions cover founding sellers and qualified referrals, separate seller/collector pre-launch lists, wishlists and alerts, demand matching, collections, and transaction-derived CAD data. These are future strategy, not authorization to implement beyond 3.5.
- Referral rewards require meaningful activation/contribution. Never fabricate inventory, demand, transactions, market prices, savings, reviews, or partnerships.
- Prefer existing architecture over duplicate systems. Keep business rules configurable where appropriate. Treat synchronization as reliability-critical, with authentication, authorization, idempotency, retries, observability, and buyer/seller privacy.

## Resuming in another conversation

Read this file, `AGENTS.md`, `IMPLEMENTATION_STATUS.md`, and the source specifications. Recheck the working tree and current evidence before acting; this note is context, not proof that pending work has been completed. Keep the stop-after-3.5 boundary unless the user changes it.




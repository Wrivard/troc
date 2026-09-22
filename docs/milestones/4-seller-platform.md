# Milestone 4 seller platform slice

Status: **In development**. Isolated, unmounted implementation. Not Live; no production database migration, payment/KYC activation, email, rewards or deployment performed by this task.

## Existing implementation reused

Foundation already provides seller application validation, seller_applications, seller_accounts, seller_members, user_roles, seller_settings, seller_verification_status and append-only audit_events. This slice extends those tables via additive 0009, reuses applicationInput and existing transaction/SQL interfaces. It does not fork inventory or commerce.

## Integration contract (task A)

1. Apply 0009_seller_platform.sql after 0008 in an isolated database first. No dependency on C's 0010. Existing RLS/backend-only access remains; no browser grants.
2. In foundation.ts import SellerPlatformService and sellerPlatformRouter. Instantiate the service with pool and existing transactionStore. Move/replace the existing POST /seller/applications handler after transactionStore initialization to call service.submit(await principal(req,res),req.body), retaining status 201 and id/status/created_at response. Do not leave the old handler before the new one. Existing minimal clients remain compatible: profile defaults to contact name and optional empty fields.
3. Mount sellerPlatformRouter(pool, transactionStore, principal) inside the existing origin-checked authenticated foundation router before its error handler. It exports GET /seller/applications, GET /admin/seller-applications?page=0, POST /admin/seller-applications/:id/review, GET /seller/platform/sellers, GET /seller/platform/:seller/dashboard, GET/POST /seller/platform/:seller/team. All paths are relative to /api. Keep existing auth, mutation origin/CSRF checks, JSON limits and DomainError handling. Do not mount on a public route.
4. Lazy-load SellerPlatformApp in marketplace main.tsx for /seller/apply (view apply), /seller/dashboard (dashboard), /seller/team (team), /admin/seller-applications (admin), ahead of planned InformationPage routing. Wrap in existing PreferencesProvider. Import existing marketplace CSS. Do not import harness.tsx in production. Add SSR handling only with the existing private/no-store/noindex conventions; never SSR private data without authenticated server access.
5. Preserve existing seller inventory route and commerce order pages. Shared messages/status/roadmap updates belong to A. Run combined test/lint/typecheck/build/browser checks before activation.

## Behavior and authorization

Authenticated active accounts submit one open/approved application. Rejection permits a new application. Existing minimal payload semantics and response shape are retained. New optional profile captures display name, bounded HTTP(S) store URLs, games, tools, inventory size, sales range and a tax-registration boolean; no tax ID, bank information or identity documents collected. KYC/payout fields remain not_started/not_connected.

Manual approval checks current database admin role, rejects self-approval, locks the application and active applicant, creates one active Free/New seller plus owner/settings/verification rows and records an immutable transition audit in one transaction. Retrying any terminal decision returns 409 without duplicating accounts. A review note is mandatory and visible to the applicant. Requested verified seller categories confer no badges, identity verification or payout eligibility. No first-250, Pro-forever, founding reward or level progression is granted.

Team changes require current active seller ownership in the database, including for global admins (no membership override). Principal role/membership claims alone cannot grant access. Seller-row locking serializes mutations and last-active-owner checks. Owners assign existing account UUIDs; invitation sending/acceptance is not implemented. Managers cannot promote themselves. Removing/demoting the last active owner fails. Account suspension elsewhere can still remove the last active owner; a coordinated recovery/admin lifecycle is remaining scope.

Dashboard reads only the selected active seller's database records, with current membership required. Non-demo active listing count, stock units and asking value are inventory estimates, not revenue. Completed merchandise subtotal is all-time CAD merchandise minus discounts, excludes shipping/tax/fees, demo orders, sim-prefixed payment IDs, missing payments, non-completed statuses and any refund. This is not net earnings. Current commerce is simulated, so normal current data yields zero eligible real orders. A future real payment provider must supply explicit verified provenance before these metrics can serve production analytics; prefix filtering alone is not payment verification. Views/conversion/demand/advanced analytics remain explicitly unavailable. No placeholder sales are synthesized.

## Prelaunch linkage agreed with C

C owns anonymous seller leads and consent; B owns authenticated applications and approval. Future bridge must prove the signed-in account owns the lead email server-side, record an idempotent association and honor consent/withdrawal. Never accept an arbitrary client lead ID or treat a lead/referral as account approval, verification, activation or reward. Anonymous resubmission cannot restore withdrawn consent. No bridge is activated in 0009.

## Verification and local harness

Use direct node executables if pnpm exec wrappers fail on Windows:

- node node_modules/tsx/dist/cli.mjs --test tests/seller-platform.test.ts
- node node_modules/tsx/dist/cli.mjs tests/seller-platform-server.ts (in-memory PGlite, API 4311, UI 5311, loopback only; test identities must never be wired into production)
- node tests/seller-platform-browser.mjs
- node node_modules/typescript/bin/tsc --build
- node node_modules/typescript/bin/tsc --noEmit -p artifacts/api-server/tsconfig.json
- node node_modules/typescript/bin/tsc --noEmit -p artifacts/marketplace/tsconfig.json

Database tests apply all migrations fresh and execute writes as troc_backend. Cover input compatibility/bounds, unauthorized/support/admin boundaries, duplicate applications/approval retries, self-review, missing/inactive users, owner-only changes, stale claims, cross-seller access, last-owner protection, revoked access, append-only transition audit, empty dashboard and exclusion of simulated/demo/refunded/other-seller orders.

Remaining broader Milestone 4 scope: full promotions engine, invitations/acceptance, payout/KYC providers, advanced analytics/reputation/levels, full onboarding recovery and membership pagination. Milestone 5.5 owns configurable rewards. Hosted authentication/database activation remains subject to existing project prerequisites. This bounded slice is not the entire milestone.

## Verified handoff — 2026-09-22

Merged release 512a37e05c6549e186de0b8209a8648b22222db7 into this isolated worktree (merge 33f5919), with no conflicts or edits to shared source files. Seller implementation checkpoint: f3e16dd; final follow-up contains module-only visual refinements, build harness and this evidence.

- Combined baseline + 0009: **79 tests passed**, including nine seller tests/subtests and existing commerce/inventory/security regressions. All migrations applied to fresh PGlite; application/approval/team transactions run as **troc_backend**, verifying migration grants and RLS policies rather than relying on migration-owner write privileges.
- Whole existing API modules/routes, marketplace and tests lint passed. Library build/typecheck and API/marketplace no-emit typechecks passed.
- Marketplace client + SSR and API production/serverless builds passed. Since production entrypoints deliberately do not import the seller slice yet, `node tests/seller-platform-build.mjs` separately built the actual seller UI/harness dependency graph successfully into ignored node_modules/.cache.
- Seller browser checks passed again after merging the release: eight combinations (390/1280px × EN/FR × dark/light), no page errors/overflow; last-owner rejection, application submission, admin approval and denied-auth empty-state protection. Desktop/mobile screenshots inspected locally; temporary screenshots are not committed.
- Existing scale tests regenerated their timing evidence; these unrelated generated changes were restored to the merged release versions. No shared design/status/config/package files were edited.

Test harness files (`harness.tsx`, seller-platform-server.ts, seller-platform-browser.mjs, seller-platform-build.mjs) are local development/test entrypoints only. Production wiring must import SellerPlatformApp/service/router, never harness identity code. No external emails, production migrations, push or deployment were performed.

## A integration candidate — review pending

The isolated integration checkout now wires the single application POST and four lazy-loaded seller/admin views. Seller middleware precedes the application POST so the common limiter covers submissions. Existing origin/auth/no-store/JSON guards remain. Legacy profile={} approvals fall back to contact_name; migration0009 uses baseline0008 locking privileges without granting primary-key updates.

Local checks: 80 combined tests passed before the additional production-router regression, which also passes. Actual main.tsx browser checks pass all eight viewport/locale/theme cases and application/admin/team/denied-auth workflows. Lint/typechecks/full builds and bundled SSR smoke passed before final limiter ordering change; final candidate checks follow. These are local functional results, not production capacity or hosted authentication proof.

For actual integrated routing, run seller-platform-server.ts with SELLER_INTEGRATED=1, SELLER_API_PORT=3015, SELLER_UI_PORT=5185, PORT=5185 and API_ORIGIN=http://127.0.0.1:3015. Run browser tests with SELLER_ORIGIN=http://127.0.0.1:5185. Defaults remain B-owned4311/5311; do not collide with other tasks. Identities and PGlite are local-only. Fresh process resets fixtures.

Release is HELD under the mandatory reciprocal review protocol. B reviews A integration diff; C reviews seller implementation plus fixes. Hosted auth/database, representative PostgreSQL contention/load and operational activation evidence remain BLOCKED. No next milestone or production-ready claim until mandatory criteria pass.

Final local candidate checks: all 81 tests and lint passed; API production/serverless bundles rebuilt after limiter ordering fix. Earlier full client/SSR build and integrated browser results remain applicable because no frontend code changed after those checks.

A01 local follow-up: configured route-scoped hosting headers and EN/FR titles for the four new seller/admin pages. Two production-router/config regressions pass;8actual-main bilingual title/heading cases pass; lint, typecheck, marketplace client+SSR build pass. Hosted-header behavior remains unverified; B independent diff retest requested separately. C review identified C01–C04 UI pagination/detail/error-recovery/large-money issues; B owns fixes and C retest. No production readiness approval.

## Reciprocal review fixes C01–C04

Admin review now exposes all submitted profile fields with explicit missing values and previous/next pages using the existing paged endpoint. Mutation errors retain correction controls, while failed data loads remain fail-closed. CAD formatting uses BigInt integer-cent decomposition and locale format parts, retaining the cent in 9007199254740993 without Number rounding. No service, permission or database contract changed. Focused regressions: seller-platform-money.test.ts and seller-platform-review-browser.mjs (explicit UI API fixtures; eight EN/FR × theme × viewport combinations), alongside actual-database seller and integrated-route tests. C independently retests the stable fix commit; local author checks do not close production readiness gates.

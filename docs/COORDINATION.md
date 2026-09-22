# TROC concurrent task coordination

Updated 2026-09-22.

## Latest authorization and parallel assignments

The user explicitly authorized later milestones where dependencies allow on 2026-09-22, asking us to be extremely careful not to break existing behavior. This supersedes historical stop-after-3.5 notes only for the bounded assignments below; it does not authorize uncontrolled roadmap expansion.

- **Orchestrator: 01a0c9c3-7aec-7f60-b187-f2c1fefd2db9.** Owns this root coordination document, assignments, shared-file arbitration and release sequencing. Report milestones, blockers and handoff commits here using task messaging.
- **Agent A: 01a0c994-3aa1-7700-9d47-040948c4bdfa.** Retains 3.5 and integration ownership. Finish design + 3.5 integration first; later integrate B/C separately after review. Own shared routing, existing auth/commerce/inventory contracts, root package/lock files, shared translations/types, implementation status/roadmap/memory and deployment configuration. Coordinate a handoff of any shared file before another agent edits it.
- **Agent B / 01a0c9c6-b40a-77c3-8757-22ff6dbf93fd: `Troc-Milestone-4-Seller/`.** Bounded Milestone 4 seller application, manual admin approval, seller team management and real-data dashboard foundation. Own new backend `modules/seller-platform/`, `routes/seller-platform.ts`, frontend `modules/seller-platform/`, new `tests/seller-platform*`, `docs/milestones/4-seller-platform.md`, and additive migration `0009_seller_platform.sql`. Reuse 3.5 inventory and existing account/seller/auth contracts; do not rebuild imports/listings, implement payment/KYC providers, or automatically award founding benefits. Later 5.5 configurable reward rules supersede old permanent-benefit copy. Broader promotions, advanced analytics and other unimplemented Milestone 4 items must be reported as remaining scope.
- **Agent C / 01a0c9c6-db14-7200-a837-1feede59dbab: `Troc-Growth/`.** Milestone 6.5 isolated prelaunch collector/seller waitlists, private lead admin, source/referral attribution, consent, cohorts and honest funnel events. Own new backend `modules/prelaunch/`, `routes/prelaunch.ts`, frontend `modules/prelaunch/`, new `tests/prelaunch*`, `docs/milestones/6-5-prelaunch.md`, and additive migration `0010_prelaunch_growth.sql`. Extend existing waitlist/lead tables rather than duplicating them. No seller approval/accounts/teams or referral rewards; seller lead is not an approved seller. Future seller-activation linkage is a documented contract with B/A.

Both new worktrees start at committed 3.5 baseline `f4b830eb62e9a0d2c2f9ac247b51d7ac07b0dc70`. They must inspect existing implementations before editing. They may make local commits in their own worktrees; no main checkout, main push, production migration, deployment or external email/webhook sending. Neither may edit another checkout or this coordination file. Use separate local test databases and ports (B 4311/5311; C 4312/5312); stop only processes owned by that task.

Shared wiring is supplied as explicit integration instructions in each task's milestone document and installed by A after agreement. Test unmounted modules/routes with a task-local harness. If that would prevent useful validation, request exact shared-file ownership from the orchestrator rather than silently modifying it. No shared header/footer/style-guide changes. Use existing design tokens and EN/FR patterns in module-owned files. No new packages without coordination.

Migration numbers are reserved, not permission to change existing migration checksums or production data. B and C migrations must be independently additive on baseline 0008; C must not depend on 0009. A applies and tests both in sequence in an isolated database before release. No production activation solely to make a preview work. Fail closed where hosted authentication/database prerequisites are absent.

Acceptance: report actual changed paths, stable commit, tests and limitations; acknowledge ownership before implementation. A reviews migration/authorization and shared contract changes, combines one track at a time with final design, runs relevant regression tests, typecheck/lint/build and browser checks, then verifies deployment health under the existing serialized release authorization. New work is In development until those gates pass. If a task needs an unready dependency, report it and continue independent scope; never fake the dependency.

## Original ownership and workspaces (historical scope; latest assignments above prevail)

- **Milestone 3.5 / task 01a0c994-3aa1-7700-9d47-040948c4bdfa:** works in `Troc-Milestone-3-5/`, an isolated Git worktree based on `9b45877`. Owns inventory schema/domain/API/imports/tests/docs and new seller inventory functionality. Stop before Milestone 4.
- **Design / task 01a0c68d-0c6c-7141-b324-bb4a6f618553:** uses `Troc-Brand-System/`. Owns existing-page design, CSS, style-guide components and visual assets. Its initial pass is complete; the user subsequently authorized another meticulous design pass, which is active. It has acknowledged the split and will send its verified final commit before milestone integration.

## Integration rules

- Agent A reserves local API port 3015 and Vite port 5185 until its verification finishes. B uses 4311/5311 and C uses 4312/5312; never stop another task's processes.
- Communicate before changing shared routing, shared types/translations, package/lock files, implementation status or deployment configuration.
- Each task stages only its own changes. Preserve unrelated edits and never force-push.
- Separate worktrees prevent file overwrites, but shared database changes and main deployments still need coordination. Use local test databases for development.
- Design task deploys its newly authorized pass first. Milestone task then coordinates integration and deployment after tests/builds and relevant browser checks pass against the combined changes. Both tasks have agreed to serialize main pushes.
- Check current task status before integration; this record can become stale. Record file/contract changes and communicate them directly when another task is active.

## Confirmed baseline

Latest design handoff: design task reports final main `e236c29`, with design code `9f4f58e` deployed and live verified (40 live route checks and 3 cart/Smart Cart checks). Deployment slot released to Agent A; no further design pushes planned. Evidence is reported by the design task in `DESIGN_QUALITY_REVIEW.md` and `IMPLEMENTATION_STATUS.md`, not independently rerun by the orchestrator. A must integrate and verify 3.5 against this design; B/C must bring their own checkouts forward to A's resulting release before final combined verification.

Design implementation `1d14f16` and evidence commit `9b45877` were reported deployed and verified by the design task. Details: `Troc-Brand-System/docs/WORLD_CLASS_DESIGN_REFINEMENT.md`.

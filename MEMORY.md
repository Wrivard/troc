# TROC shared working memory

Updated: 2026-09-22. This note preserves context across conversations using this project. Update it when scope, decisions, or verified progress changes. Do not record credentials here.

## Latest checkpoint — concurrent Milestone 3.5 work

Latest authorization: the user explicitly asked to start later work where dependencies allow. Orchestrator `01a0c9c3-7aec-7f60-b187-f2c1fefd2db9` assigned bounded Milestone 4 seller work to `01a0c9c6-b40a-77c3-8757-22ff6dbf93fd` in `Troc-Milestone-4-Seller`, and isolated early 6.5 growth work to `01a0c9c6-db14-7200-a837-1feede59dbab` in `Troc-Growth`. Those worktrees started at `f4b830e`; they must update to the final design+3.5 release before final verification. Migration 0009 belongs to seller work, 0010 to growth. This task remains the milestone integrator, one track at a time; neither new task may push main, deploy or migrate production. This supersedes historical stop-after-3.5 language only for those bounded assignments. See docs/COORDINATION.md for details.

- The user authorized Milestone 3.5 alongside the other conversation's design work. Ownership was acknowledged in both tasks. Milestone task: `01a0c994-3aa1-7700-9d47-040948c4bdfa`; design task: `01a0c68d-0c6c-7141-b324-bb4a6f618553`.
- Milestone implementation is in the isolated `Troc-Milestone-3-5` worktree. Local implementation/audit checks pass: 70 domain/database tests, 13 browser cases, type checking, lint, production builds and bundled SSR smoke checks. See `docs/MILESTONE_3_5_AUDIT.md` for evidence and limits.
- The design task received another authorized design pass and is active. It deploys first and sends its final commit; this milestone task then integrates and verifies the combined changes. Do not overlap main pushes or overwrite the other checkout.
- Hosted database/auth activation remains blocked by existing configuration. Migration 0008 must be applied before inventory activation. Source labels are not live integrations. Stop before Milestone 4.
- Earlier text below preserves the original request and initial checkpoint; the latest checkpoint supersedes its pending-work statements.

## Current direction

The user has now authorized working on Milestone 3.5 alongside the other conversation's page design work. See `../COORDINATION.md` for ownership and integration rules. Milestone work uses `../Troc-Milestone-3-5/`, isolated from this design checkout. The design task acknowledged the split and reports its current design work complete, with no further pushes planned. Milestone implementation and verification remain pending.

The user supplied “Initial Prompt — Additions to the Existing TROC Roadmap” and asked this conversation to save shared memory. The durable source for that prompt is `../INITIAL-PROMPT.md`; the added milestone specifications and `DOCS-STRUCTURE.md` are also in the parent build-pack directory.

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

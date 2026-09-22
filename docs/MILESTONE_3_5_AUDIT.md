# Milestone 3.5 audit

Date: 2026-09-22. Status: **Implementation and audit complete; application deployed and verified. Hosted inventory activation remains In development** because database/authentication prerequisites are unavailable.

Release code: `e8b8b9209a5bd576376ba8f5c3331a62d6c3a574`, including final design code `9f4f58e` and design evidence `e236c29`. Vercel reported successful deployment. **20 live page checks passed** across homepage, search, cart, Smart Cart and seller inventory at 390/1280 widths in EN/FR. The inventory page fails closed with an honest unavailable/access state; no hosted authenticated inventory write is claimed. Evidence: `verification/inventory-live.json`.

## Architectural result

Milestone 3 already had the correct canonical product/printing/variant versus seller-listing separation, stable UUIDs, seller SKUs, canonical provider mappings and transactional checkout reservations. No rebuild or duplicate catalog was needed. Migration 0008 extends listing identity/provenance/sync fields, adds optimistic versions and a durable state-event outbox, and preserves existing commerce quantity audit records.

The new `/seller/inventory` flow includes authorized seller selection, bounded canonical search, manual raw-single listing, inventory filters and keyset pagination, explicit versioned quantity/price edits, atomic selected-row actions, reusable CSV mappings, row-by-row review and retry-safe atomic publication. The catalog remains read-only to seller imports.

## Findings fixed during implementation

- Restricted-role execution identified missing grants/RLS for external catalog mapping reads and listing insertion. Added explicit narrowly scoped grants/policies and verified writes under `troc_backend`, not the migration owner.
- Listing revisions now change on every database update, including checkout and restock. Seller writes lock listings, reject stale versions and reject live checkout reservations; failed multi-row writes roll back earlier changes.
- Import identities are unique within seller and source; repeated publication reuses the committed result. Conflicting previews cannot overwrite existing stock or partially publish.
- Photo requirements use the persisted commerce threshold. New photo-required listings remain draft; bulk activation cannot bypass required photos. Price edits cannot lower the regular price below an existing sale price.
- Mobile CSV file input exceeded the viewport; bounded its width/minimum size. Retained shared approved typography, header/footer, controls and theme/locale preferences.
- Isolated the larger body parser to import preview requests. Tested foreign-origin rejection and fail-closed identity for payloads above the ordinary 16 KB API limit.
- Interrupted-connection messaging does not claim a write failed when its result is uncertain. Selecting a new CSV clears the prior preview immediately, preventing accidental publication of an older file after a rejected upload.
- Browser header detection is bounded before rendering mapping controls; oversized, duplicate, empty or unfinished quoted headers cannot create an unbounded mapping UI.

## Validation evidence

- Full domain/database/HTTP suite: **70 tests passed** after inventory and photo-policy changes. Additional HTTP/body-scope and failed-bulk rollback assertions passed after their final updates.
- Import audit: **100, 1,000 and 10,001 rows** matched/published, with idempotent retries and no canonical-card duplication. Local measured timings are in `verification/inventory-scale.json`; these are PGlite test timings, not hosted capacity promises.
- CSV tests cover quoted commas/quotes/newlines, malformed quotes, duplicate headers and integer-cent parsing. Database tests cover unknown/ambiguous identities, existing/in-file duplicates, concurrent-preview publication conflict, seller boundaries, unprivileged browser denial, reservation protection, version conflicts, atomic bulk rollback, append-only events and photo gating.
- **13 browser cases passed**: 390/768/1280 widths × EN/FR × light/dark, plus manual listing → CSV publication → stock update → unauthorized state. Main-content WCAG A/AA checks, horizontal overflow, and JavaScript errors were checked. Evidence: `verification/inventory-browser.json`.
- Type checking and lint passed. Full workspace production build passed using the repository-required PORT/BASE_PATH environment. Bundled production SSR and internal catalog API smoke checks passed.
- GitHub reported Vercel success for baseline main `9b45877967aec23b325d0cba1db438c2cdeeddd0`. This is baseline health, not a claim that 3.5 is already deployed.
- Combined final design `9f4f58e` and evidence `e236c29` merged without conflicts. Against that combined code: 70 tests, lint, 13 inventory browser cases, full production build/type checking and bundled SSR smoke checks passed again. Design's own final evidence remains in DESIGN_QUALITY_REVIEW.md.

## Scope and activation limits

- Hosted inventory requires configured real Supabase authentication, database/backend role and migration 0008. Existing hosted activation blockers remain; no production credentials or database were modified by this task.
- Import creation is for raw singles. Existing sealed and graded listings are preserved; their specialized creation, physical metadata, grading and photo-upload workflows remain with the broader seller platform. Photo-required raw singles remain drafts until approved photos exist.
- Imports create listings; they do not silently merge or replace existing SKUs. Errors must be corrected and re-previewed. Technical limits: 20,000 rows / 4 MiB CSV, 500-row DB batches, 100 explicit bulk edits, 50-row pages and 24-hour preview publication validity.
- Sources are provenance labels. Live external connectors, signed webhook delivery, retry workers, integration credentials and actual sync health are Milestone 4.5. Events prepare for retries via immutable event IDs/versions; no external delivery is claimed.
- Seller substring search and bounded preview JSON storage should be measured on the production dataset before broad launch. Set an operational retention policy for private import previews before activation. No fabricated integrations, prices, demand, transactions or savings.

## Concurrent design work

Milestone work is isolated in `Troc-Milestone-3-5`; the design task works in `Troc-Brand-System`. The design task deploys first, then this task integrates its final commit and verifies the combined build/flows before any main push. Shared routing/status changes are coordinated; generated design assets and unrelated local files are not staged by this task.

## Deployment and recovery

The Vercel application can be deployed before hosted inventory is activated: missing authentication/database configuration fails closed, and existing public/demo commerce remains available. Apply migration 0008 through the existing checksum migration runner with migration credentials, then use the dedicated backend role for the server. Do not apply production migrations merely to make demo pages look active.

Migration 0008 is additive. A UI/API rollback should revert the inventory application changes while retaining existing listing identities and data; do not drop inventory records, import review history or audit events as a rollback shortcut. If a future hosted activation fails, disable the affected workflow and investigate configuration rather than fabricating demo authentication.

This implementation task stops after 3.5. The user's later instruction authorizes bounded separate Milestone 4 and early-isolated 6.5 tracks; see COORDINATION.md. They are not included in this release or claimed complete.

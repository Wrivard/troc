# Milestone 6.5 — isolated prelaunch growth

Status: **In development**. This is an unmounted implementation, not a live launch.
No production database, hosting configuration, email delivery or marketplace
entrypoint has been changed by this task. Owner: Agent C, `Troc-Growth`.

## Implemented boundary

- Separate collector and seller interest paths, EN/FR, existing design components
  and semantic tokens. All navigation stays within early access. Seller interest
  is explicitly not seller approval, a badge, an integration or a promised reward.
- Extend `buyer_waitlist` and `founding_seller_leads`; retain their existing IDs,
  consent/version/timestamps and separation from demo provenance/purge. Existing
  account `consent_records` requires a user ID and is intentionally not misused
  for unauthenticated leads. Lead consent evidence uses existing append-only
  `audit_events` plus original consent columns.
- Collector email, province, games and optional channels/frequency/frustrations/
  wishlist. Unanswered frequency is `not_specified`, never inferred. Seller
  contact, channels, tools, inventory band, region, type and experience.
- Explicit unchecked prelaunch email consent, Canadian confirmation, seller
  adulthood confirmation. Anonymous email is **unverified**. No automated email.
- First submission wins under a transaction-level normalized-email advisory
  lock. Case/space duplicates return the same neutral response, cannot overwrite
  details/acquisition or restore consent. Legacy duplicates are preserved and
  suppress new captures; 0010 performs no destructive deduplication.
- Client-generated 256-bit withdrawal capability, shown after submission and
  stored only as SHA-256 server-side. Withdrawal is idempotent, clears cohort,
  increments revision and appends audit evidence. It never confirms an email
  exists. A repeated signup's new code does not control an existing lead.
- Private admin: role `admin` only, paged filters by kind, province, games,
  channels, inventory band, software, experience, type, cohort and review status.
  Reads and writes audited. Updates use optimistic revision checks. No automatic
  rejection or seller approval. Cohorts: unassigned, internal, founding sellers,
  private alpha, collector closed beta, public. Assignment never sends an invite.
- Admin-created referral codes can be associated with a consented existing lead;
  the association is never publicly returned. Anonymous clients cannot select a
  referrer lead ID. Capture resolves an active code server-side, excludes same-
  email self-referral across lists and ignores withdrawn owners/revoked codes.
  Campaign codes without an owner are also supported by the service. No reward.
- HMAC-signed 24-hour sessions freeze allowlisted source and resolved referral.
  Body fields cannot replace session attribution. URL source is explicitly
  unverified acquisition, not proof of identity/qualification. The landing path
  carries only bounded `source` and `ref` parameters into the chosen form.
- Durable database throttle: 40 requests per client address / 15-minute fixed
  window; HMAC-derived, rotating keys, no raw IP stored. Honeypot, bounded fields,
  small JSON payloads, enum validation, no arbitrary metadata storage.

## Honest funnel foundation

Events are optional and require separate analytics consent. Each `(session,name)`
is unique. Browser observations (`landing_visit`, `cta`, `form_start`) cannot forge
server-only `completion` or `referral`; completion is emitted only on a new lead.
The shipped form starts observation only when optional analytics is selected:
`form_start` means first observed form activity, not necessarily the first field.
It does **not** backfill landing/CTA events for earlier unobserved actions. The API
supports these observations for a later consent-aware landing integration.

Counts represent consented sessions, not verified people, conversion rates,
transactions or qualified demand. Retries and duplicate emails do not inflate
completion. Nonconsenting submissions are saved without analytics events. Admin
reports explicitly list invitation, account activation, seller activation, first
inventory and first transaction as **not instrumented**, never fabricated zeros.
No cross-device attribution, automatic invitations or abandonment reminder emails.

## Exact integration contract — Agent A owns shared wiring

1. Review/apply `0010_prelaunch_growth.sql` with the migration role in an isolated
   database, first after 0008 alone, then after B's 0009. It has no 0009 dependency.
   Runtime uses the existing `troc_backend` role, never migration credentials.
   New tables have RLS and no public grants; no browser database access.
2. Mount `prelaunchRouter(pool, transactionStore, principal, config)` at
   `/api/prelaunch` **before** the existing catch-all foundation router, preferably
   in `app.ts` after cookies and before the general JSON parser. The module has a
   12 KB parser; placing it after the existing 16 KB parser preserves field bounds
   but means the global parser controls raw body size. Reuse the current
   transaction adapter and verified `authClient(...).auth.getUser()` +
   `ensureBuyer()` principal resolver. Never copy the test harness principal.
3. Supply config explicitly from server-only environment:
   `enabled: PRELAUNCH_ENABLED === 'true'`, `databaseReady` only when the existing
   database/auth prerequisites and migration are ready, `appOrigin: APP_ORIGIN`,
   `signingKey: PRELAUNCH_SIGNING_KEY` (cryptographically random, at least 32 chars).
   Missing/disabled config returns 503 `prelaunch_unavailable`; database/schema
   failures do too. Never use catalog demo mode to bypass prelaunch prerequisites.
   Secret rotation invalidates outstanding sessions only, not withdrawal codes.
4. Client route gate: add only `/early-access`, `/early-access/collector`,
   `/early-access/seller`, `/early-access/withdraw`, `/early-access/admin` to the
   current shell route allowlist and lazy-load `PrelaunchApp({path})` under the
   existing `PreferencesProvider`. Keep homepage/header/footer untouched. The
   gate must agree with server activation; a build-time flag alone is not access
   control. Admin UI can show a shell but API always authenticates first.
   This component follows current client-only account/inventory rendering; do
   not SSR the browser preferences provider. Serve no private leads in HTML.
5. Preserve same-origin POST/PATCH checks and `Cache-Control: no-store`. Supply
   correct HTTPS APP_ORIGIN in hosting. Configure trusted proxy hops only after
   verifying the hosting adapter; never blindly trust arbitrary X-Forwarded-For.
   No body, withdrawal capability, authorization header or email in logs. Existing
   request logger drops query strings; preserve that behavior. Consider noindex
   for admin/withdrawal pages; add route-local titles in shared routing.
6. Run combined regression/typecheck/lint/build/browser checks, verify actual
   hosted config and route behavior, and update shared status through A. Until
   then keep **In development**. No push/deploy authorization belongs to C.

Endpoints relative to `/api/prelaunch`:

| Method / path                  | Contract                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| POST `/sessions`               | kind, allowlisted source, optional referral, analyticsConsent → signed token                   |
| POST `/leads`                  | token + validated kind-specific fields + consent/version + withdrawal capability → neutral 202 |
| POST `/events`                 | token + one allowed browser observation → 202; no client completion/activation                 |
| POST `/withdraw`               | kind + original withdrawal capability → neutral 202                                            |
| GET `/admin/leads`             | kind + optional filter parameters + zero-based page; 51 rows (50 + next-page sentinel)         |
| PATCH `/admin/leads/:kind/:id` | cohort, status, revision → success or 409; withdrawn leads cannot join cohorts                 |
| POST `/admin/referrals`        | optional kind + leadId → random code, audited; active consent required for an owner            |
| GET `/admin/metrics`           | consented event counts, provenance, explicit uninstrumented stages                             |

## Future activation bridge (agreement with B)

Only a server-authenticated, verified-email owner may link a lead to an account.
Never accept an arbitrary client lead/referrer ID. Match normalized verified
email, preserve immutable acquisition, and check withdrawal/current consent for
the intended contact purpose. An unverified waitlist entry must not authorize
account actions, approve a seller, assign a badge or create a reward.

Seller B owns applications/approval/team contracts. A later bridge must verify
both the referred seller and any lead-owned referrer account, then pass original
attribution to Milestone 5.5 for qualification/anti-abuse review. Waitlist consent
is not permanent reward entitlement. Refund-aware first-transaction events belong
to commerce, not a public analytics endpoint. Future server event ingestion needs
its own source-event idempotency and verified entity linkage.

## Operational limits and remaining work

- No mail delivery/double opt-in; addresses and interest are unverified. Do not
  launch bulk email based solely on these entries. Lost withdrawal codes need a
  later verified recovery/support flow; email-only lookup cannot safely replace
  this capability. No anonymous reconsent or profile overwrite endpoint.
- Retention/deletion workflow is not automated. Before activation, decide an
  operator-owned policy for real leads, audit retention and optional telemetry.
  Rate-window cleanup can delete expired rows with a maintenance role (runtime
  has no DELETE). Sessions referenced by events must be retained together or
  removed in event-first order. No production cleanup job is installed.
- Rate limiting mitigates bursts, not distributed abuse. Email ownership checks,
  configurable edge abuse controls and operational monitoring remain launch gates
  for broad traffic. Shared-IP limits may need a reviewed adjustment.
- Pagination is bounded offset pagination, indexed for review filters; no export,
  bulk invitations, advanced cohort scheduling or qualification/rewards.
- Legacy entries have no new withdrawal capability or details. Preserve their
  existing consent evidence and use verified operator handling for requests.
- No evidence is claimed for production concurrency, hosted auth/provider setup,
  production mail, live capture or deployments. No synthetic leads are shipped.

## Local verification

Run from `Troc-Growth` with the pinned dependencies installed:

```text
node node_modules/tsx/dist/cli.mjs --test tests/prelaunch.test.ts
node node_modules/tsx/dist/cli.mjs tests/prelaunch-harness.mts
node tests/prelaunch-browser.mjs
```

The harness binds only `127.0.0.1:4312/5312`, uses an in-memory PGlite database,
and an explicitly test-only admin identity. Stop it before running the HTTP tests
(they reuse 4312). Never mount or deploy `harness-entry.tsx` or the test harness.
Tests exercise actual services with `SET LOCAL ROLE troc_backend`, API config and
origin gates, RLS denial, validation, duplicates, withdrawal, optimistic admin
updates, filtering, attribution/signature tampering, event deduplication, referral
revocation/self-attribution and throttling. Browser checks exercise responsive
EN/FR light/dark paths, accessibility and real API capture/withdrawal.

Final combined results and commit are recorded below after the release-baseline
merge and verification.

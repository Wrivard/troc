# Bounded staging contention and failure validation

Status: **In development. Real staging execution BLOCKED.** This implements C's
`MILESTONE-REVIEWS/C/STAGING-PLAN.md` as reusable tooling; it does not replace the
plan or provide representative load/capacity evidence. A schedules all remote work,
provisions fixtures/access and integrates reviewed commits. No schema/configuration
mutation, fixture creation, destructive cleanup, email or payment is performed.

## Before execution

A must approve the exact candidate, time window, fixture IDs and budget. A JSON
manifest's `approvedBy` field records that agreement; writing it is not authorization.
No supplied credential is inferred from existing public Supabase configuration.
Run only a clean, committed candidate with the existing locked dependencies installed.

Provide `SUPABASE_URL` for designated project `wcpsyflzqaeorxaejaqh` and `DATABASE_URL`
through an approved local secret mechanism. Direct endpoint port 5432 or A-verified
session pooler host (`STAGING_POOLER_HOST`, explicit port 5432) is accepted. Transaction
pooling is rejected: transactions need independently pinned server connections.
The runtime login must be `troc_staging_runtime` (project-suffixed in pooler username),
with existing `troc_backend` membership. URL query options are discarded and TLS
certificate verification is mandatory. No insecure-certificate fallback exists.

**Audit observation is a separate prerequisite.** Existing runtime cannot SELECT
audit_events. Do not broaden its grants. A must explicitly provision/approve a
dedicated `troc_staging_observer` connection in `STAGING_OBSERVER_DATABASE_URL`, with
no backend membership, table mutation, schema creation, ownership or dangerous role
membership. It needs SELECT plus an RLS policy restricted to this run's synthetic
audit entity IDs (`runId`, application, seller). This is a requested configuration
handoff, not a migration or grant executed by this tool. An existing fixture audit
probe must be visible, preventing a default-deny observer from falsely reporting
zero audits. Observer stays in BEGIN READ ONLY at READ COMMITTED during the run.

Both roles must have verified TLS, actual role/session identity, at least 67
RLS-protected application tables, no dangerous reachable roles and no reachable
table ownership. Server PIDs must differ and stay stable. The read-only preflight
checks runtime only; it is not a claim that execution prerequisites or Auth pass.

## Commands

From the application checkout, with existing dependencies installed:

```text
node scripts/staging-concurrency/run.mjs
pnpm exec tsx scripts/staging-concurrency/run.mjs --execute <private-manifest.json>
node --test tests/staging-concurrency.test.mjs
pnpm exec tsx --test tests/staging-concurrency-service.test.ts
```

The default mode makes at most one read-only connection; missing configuration
blocks before dependency loading or connecting. Execution requires exactly
`--execute` and a manifest path. Keep the manifest outside Git. Use shell output
redirection for the redacted JSON result; credentials never belong in arguments.
Exit 0 means the selected mode passed, 2 means blocked before connection, 1 means
connected execution failed. CLI setup exceptions return 2 with a bounded category.

Manifest shape (replace all placeholders with A's actual scheduled values):

```json
{
  "approvedBy": "A",
  "project": "wcpsyflzqaeorxaejaqh",
  "candidate": "<40-character committed SHA>",
  "startsAt": "<ISO timestamp>",
  "endsAt": "<ISO timestamp>",
  "runId": "<unique UUID>",
  "cleanupOwner": "A",
  "preserveAudit": true,
  "allowClientDisconnect": true,
  "budget": {
    "connections": 3,
    "statementMs": 5000,
    "lockMs": 2000,
    "runMs": 120000,
    "queries": 300
  },
  "ids": {
    "admin": "<UUID>",
    "ownerA": "<UUID>",
    "ownerB": "<UUID>",
    "target": "<UUID>",
    "applicant": "<UUID>",
    "staleAdmin": "<UUID>",
    "staleMember": "<UUID>",
    "application": "<UUID>",
    "seller": "<UUID>",
    "auditProbe": "<UUID>"
  }
}
```

Window must already be open, have at least 120 seconds remaining and span at most
15 minutes. Budget values must match exactly. UUIDs must be unique/lowercase.

A prepares seven active synthetic users whose emails exactly match
`troc-d-<runId>-<lowercase key>@example.invalid`. Only `admin` has the admin role
among admin/staleAdmin. Stale users are already revoked; this tests request-time
stale principal rejection, not in-flight revocation isolation. Applicant has no
seller memberships; application is submitted, linked to applicant, has no seller
and contact_name `troc-d-<runId>`. Separate active seller slug is `troc-d-<runId>`;
its only members are ownerA/ownerB owners and target inventory staff. Both entities
initially have zero audits. `auditProbe` identifies an existing immutable event
with actor admin, entity_id runId and action `staging.fixture.created`. Fixture
setup must preserve historical records and use only A's reserved synthetic users.

## Predeclared budgets and acceptance

Three total connections (two real service clients plus one audit observer), below
the initially authorized maximum four. Maximum 300 SQL calls includes service SQL,
guards and observations; rollback/connection closure remain allowed on abort.
Every statement has a 5-second server ceiling, locks 2 seconds; driver query timeout
6 seconds, connection timeout 5 seconds, overall work deadline 120 seconds, bounded
connection close 6 seconds. These are safety ceilings, not marketplace SLOs. There
are no unbounded retries or background load loops. A must approve this exact
query budget; the original 20 sequential checks were not 20 total SQL statements.

| Scenario             | Required outcome                                                                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Duplicate approval   | Barrier starts two real transactions before work; one success, one application_already_reviewed; one linked seller/membership/settings/verification row and approval audit |
| Owner contention     | Two owners demote each other; one success and expected forbidden/last_owner, exactly one owner survives; restore second owner through service                              |
| Stale principals     | Previously revoked admin/member claims fail forbidden; member/audit state unchanged                                                                                        |
| Held seller row lock | Separate client receives 55P03; no partial member/audit change; release lock and valid retry succeeds exactly once                                                         |
| Controlled failure   | Throw immediately before audit insert after member mutation; rollback leaves member and audit unchanged; retry succeeds exactly once                                       |
| Client disconnect    | Actually call pg Client.end before audit with transaction open; observer verifies rollback; surviving real client retries successfully                                     |

The disconnect scenario is a deliberate client-initiated connection close. It is
not a killed backend, network partition, process crash or pool failover experiment.
The report explicitly leaves network fault, HTTP/Auth and capacity NOT_TESTED.
It exercises the real SellerPlatformService against an injected bounded transaction
adapter, not the deployed HTTP resolver or production connection pool implementation.

Record server PIDs/role identity, per-operation outcomes/error classes/durations,
operation count and p50/p95/max, total duration, SQL count and end-of-run RSS. No
driver messages, SQL parameters, emails, credentials or fixture row contents are
reported. Expected conflicts/timeouts are distinct from unexpected failures.
These small sample percentiles are diagnostic only. Sustained throughput, peak
resources, query plans, normal/peak/burst capacity and traffic targets require a
separately reviewed A-scheduled experiment; this runner never closes those gates.

## Abort and cleanup

Any wrong target/role/fixture/window, ownership/RLS issue, query budget/deadline,
unexpected database error, backend PID change, timeout other than the held-lock
case, or invariant failure stops subsequent scenarios. Both concurrent jobs settle
before cleanup. Transactions roll back on failure; every connection is closed.
Rollback failure is fatal, never mistaken for an expected domain conflict.

Successful membership mutations restore original roles through service calls and
keep their audits. The approved application and resulting seller remain synthetic
evidence. A owns fixture retirement after inspection. On failure, do not attempt
further compensating writes: leave committed state for A to inspect using the
private manifest. Never erase audit events, reset the database or delete other
fixtures. A failure can leave partially completed scenarios, but each individual
transaction must remain atomic. A new run needs fresh fixtures and a new window.

## Local evidence limits

Node fake-client tests cover guards, timeouts/cleanup control flow and no-write
preflight. The PGlite test applies actual migrations and service code and checks
fixture SQL, runtime audit-read denial, separate observer policy, injected rollback
and retry. Its TLS/session/database/PID fields are substituted for local SQL-shape
coverage. It cannot prove separate PostgreSQL sessions, locks or actual disconnects.
No performance optimization was justified by the local guard/service checks.
Independent C review and exact final-candidate retest are required before handoff.

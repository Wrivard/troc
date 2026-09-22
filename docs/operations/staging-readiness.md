# Runtime readiness diagnostics

This operator check is separate from `/api/healthz`, which remains process liveness only. A healthy public demo does not prove database or Auth readiness.

Run from the application checkout:

```powershell
node --env-file=.env.staging scripts/staging-readiness/check.mjs
```

Exit0 means only the reported runtime checks passed; exit2 means required configuration is missing/invalid; exit1 means a connection/query/role check failed. Output contains booleans and fixed failure categories, never URLs, credentials, user identities, SQL errors or table rows. The existing ignored `.env.staging` is operator-owned. Do not pass credentials on the command line or copy the file into reports.

Required configuration: exact designated SUPABASE_URL, DATABASE_URL, and SUPABASE_PUBLISHABLE_KEY. For a session pooler, also set STAGING_POOLER_HOST to the exact verified Connect-dialog host; the URL username must identify the designated project. No region guessing. The database name is postgres; expected application role is troc_staging_runtime with inherited troc_backend access. This script does not create roles or users.

One connection, TLS certificate verification enforced, connect/statement timeout5s, query timeout6s, lock timeout2s. URL SSL overrides are removed. Queries run in a read-only transaction and are rolled back. Results verify dedicated role identity, inherited backend access, no privileged role flags/schema creation, encrypted transport, and at least67 application tables with RLS. It does not inspect application rows, require migration-ledger permissions, test cross-seller policy semantics or prove throughput. A PASS does not validate Auth, migration checksums, backup recovery, retention, contention or hosted deployment.

## Monitoring and escalation

The role gate also rejects application relation/schema ownership and dangerous role memberships, including transitive and NOINHERIT memberships. It intentionally uses MEMBER conservatively: even a membership currently constrained by SET/INHERIT options is rejected when the target owns application relations or carries elevated capabilities. Remove unnecessary memberships rather than treating RLS-enabled table flags as proof that runtime cannot bypass policies. Tests reproduce an actual owner reading a default-deny row locally. This remains metadata validation, not a substitute for application tenant-isolation tests.

Request logs retain HTTP method, fixed API surface, response status and duration. They omit path identifiers, query strings, headers, bodies and raw driver error details. Error serializers retain only a bounded category. Never add personal data or arbitrary error objects as new log fields. Liveness remains public and lightweight; runtime diagnostics remain operator-side, avoiding public disclosure of infrastructure state.

Before activation, assign an operator and real alert destination. Proposed initial signals for review: liveness failures on three consecutive one-minute checks; any runtime diagnostic FAIL; sustained5xx above1% across at least100 requests over5minutes; repeated database timeouts/authentication failures; pool/resource saturation from provider metrics. These are proposed starting thresholds, not measured SLOs. Demonstrate alert delivery and recovery once a destination exists; do not claim monitoring is active from code alone. No external notification is sent by this tooling.

On failure, preserve the redacted result/time/candidate, keep activation flags off, and distinguish configuration BLOCKED from runtime FAIL. Check provider health and credentials privately; do not relax TLS/RLS or grant elevated permissions to make the check pass. Re-run only after a relevant correction. Recovery/retention/concurrency tools have separately owned runbooks and execution gates.

Local failure tests cover missing/wrong project, TLS override removal, read-only transaction, cleanup, elevated role, and secret-bearing errors. Real staging execution remains blocked until the runtime connection is configured; current local missing-config result is BLOCKED, not PASS.

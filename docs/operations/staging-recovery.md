# Isolated application recovery verification

Owner: milestone A operates staging; B owns this harness. This is current-readiness work, not a new milestone. No remote dump, restore, reset or deletion is authorized by the implementation dispatch. Native PostgreSQL tools were absent from PATH during development. Real recovery remains **BLOCKED** until an authorized exercise completes. PGlite tests prove verification logic only.

## Audit and scope

The existing `lib/db/scripts/migrate.mjs` uses an advisory lock, per-migration transactions and immutable ledger checksums. The checksum helper accepts LF/CRLF history and records canonical LF hashes. This is migration safety, not backup. No existing backup retention policy or native restore runner was found.

This CLI never connects to a database and never runs `pg_dump` or `pg_restore` beyond `--version`. It defaults to offline preflight. SQL files are operator-run read-only probes. Snapshot comparison covers application tables, content fingerprints, schema/security definitions, migration history, and selected invariants. It excludes Supabase Auth, Storage, platform schemas, global credentials and external services. A complete disaster recovery claim needs their separate recovery plans and tests.

## Prepare an approved plan

Record source and disposable target identities independently from the operator/provider. Do not copy unverified observations into expected identities just to pass. Use a direct or session-mode connection, never a transaction pooler. Record the actual server major; install matching `psql`, `pg_dump` and `pg_restore` from a trusted PostgreSQL distribution. The bounded harness requires the same major on source, target and tools. Do not silently upgrade or create paid resources.

Save a private JSON file outside Git with this shape (values below are fictitious):

```json
{
  "version": 1,
  "source": {
    "host": "127.0.0.1",
    "port": 5432,
    "database": "synthetic_source",
    "user": "postgres",
    "systemIdentifier": "1234567890123456789",
    "sslmode": "disable",
    "serverMajor": 17
  },
  "target": {
    "host": "127.0.0.1",
    "port": 5433,
    "database": "isolated_restore",
    "user": "postgres",
    "systemIdentifier": "9876543210987654321",
    "sslmode": "disable",
    "serverMajor": 17
  },
  "targetIsDisposable": true,
  "authorizationReference": "operator-approved exercise record"
}
```

A remote endpoint requires `sslmode: "verify-full"`, a trusted CA and verified hostname. A remote target also requires `authorizedRemoteTarget` equal to its exact `host:port/database`, backed by explicit operator authorization. This field is a guardrail, not permission by itself. Same system identifier + database is rejected even under different endpoint aliases. `identity.sql` requires permission to read `pg_control_system`; unavailable identity is a blocker, not permission to skip it. Full-data evidence requires an operator role that bypasses RLS; never grant that power to the application/browser role.

```text
node scripts/staging-recovery/cli.mjs preflight PRIVATE_PLAN.json
```

Exit 2 means native tools are absent/wrong version; exit 1 means invalid input or failed verification. `PREFLIGHT_ONLY` does not mean a recovery passed.

## Protect artifacts before collecting anything

Use an access-restricted encrypted directory outside all repositories, shared/synced folders, and web roots. On Unix use a private parent (0700), umask 077 and files 0600. On Windows inspect the directory ACL and restrict it to the designated operator/service plus required administrators; use an approved encrypted volume. Do not assume Unix mode bits enforce Windows ACLs. Record that inspection privately. Never put backup files, row fingerprints, connection files or raw tool output in Git or task messages.

Use a protected `PGPASSFILE`/OS credential mechanism and `PGSSLROOTCERT`; do not put passwords in URLs, command arguments, JSON plans, shell history or logs. Clear inherited `PGSERVICE`, `PGDATABASE`, `PGOPTIONS` and other stale libpq endpoint settings before selecting each endpoint. Pass host, port, database, user and TLS explicitly through reviewed libpq settings. Keep command output protected: PostgreSQL errors can include object/data values. This CLI does not create, upload or retain backup artifacts and therefore cannot verify their encryption/ACL policy for the operator.

## Read-only identity and snapshot collection

After A assigns a quiet window and fixture ownership, use `psql -X -qAt -v ON_ERROR_STOP=1` with the explicitly selected source/target connection. `-X` ignores user startup scripts. Run `identity.sql` against both endpoints and save stdout separately as source/target JSON. Require exit zero; never use partial output. No application schema or migration ledger may already exist on the restore target.

```text
psql -X -qAt -v ON_ERROR_STOP=1 -f scripts/staging-recovery/identity.sql
node scripts/staging-recovery/cli.mjs identities PRIVATE_PLAN.json SOURCE_ID.json TARGET_ID.json
```

Recheck target identity immediately before restore; stale probes are insufficient. A destination containing application objects is rejected: stop and investigate, never add `--clean`, drop a schema/database, or reset a project. Record TLS verification, tool versions and server identities in protected evidence. An observed TLS session alone does not establish certificate verification; the operator must use verify-full and its CA.

## Native exercise recipe — separate approval required

1. Choose a fresh disposable **native PostgreSQL** target with the approved identities. Provision only reviewed extension dependencies and NOLOGIN roles required by the archive (including troc_backend, anon/authenticated if referenced). Never copy role passwords or weaken grants to make restore succeed. Role provisioning is owned by A. Do not run the application migration runner on the empty restore target; the archive supplies schema plus ledger.
2. Stop application/fixture writes for a short agreed source window. Run `snapshot.sql` as above and capture its JSON-lines stdout; its transaction is read-only, repeatable-read, 30-second statement/2-second lock bounded. A timeout aborts evidence collection; do not silently increase limits. The probe scans all application rows. Approve its data scale/window first. Keep writes paused through the dump, or design a separately reviewed exported-snapshot workflow; otherwise counts/content cannot reliably match the archive.
3. With the **source** connection selected, produce a custom-format logical dump of the application schema, required extension schema and migration ledger. Review the exact archive inclusion list first. Use two reviewed archives: `pg_dump --format=custom --schema=troc --schema=extensions --file=PRIVATE_APP_ARCHIVE` and `pg_dump --format=custom --table=public.troc_migrations --file=PRIVATE_LEDGER_ARCHIVE`. Do not combine `--table` and `--schema` expecting a union: table selection can suppress the schema selection. Keep the source quiesced across both dumps and the source snapshot. PostgreSQL schema/table filters do not automatically include every dependency: inspect `pg_restore --list PRIVATE_ARCHIVE` and separately provision/verify required extensions. Preserve ownership/ACL entries. Do not use `--no-acl` or silently discard owner errors. This is application-only recovery, not a full Supabase backup.
4. Record archive byte count and SHA-256 using the OS cryptographic hash tool. Secure the digest and source commit/ledger identity with the archive. Check digest again before restore and after any transfer. A nonempty file or valid TOC does not prove restore success. Never upload it automatically.
5. Re-run the identity guard against the still-empty target. With the **target** connection explicitly selected, operator-reviewed `pg_restore --exit-on-error --single-transaction --dbname=TARGET_DATABASE PRIVATE_APP_ARCHIVE`, followed by the same command for `PRIVATE_LEDGER_ARCHIVE`, restores into that database. Each archive is separately transactional; failure of the second leaves the first present and the exercise failed. Preserve that target for diagnosis; do not retry or erase it automatically. Do not use `--create`, `--clean` or parallel restore. Abort on any error; preserve protected diagnostics and leave the target for inspection. Never retry against the source.
6. Run `snapshot.sql` against the restored target and compare the two complete outputs:

```text
node scripts/staging-recovery/cli.mjs verify PRIVATE_PLAN.json SOURCE.ndjson RESTORED.ndjson
```

7. Record archive SHA-256, exact commands without secrets, tool/server versions, source commit, timestamps, elapsed dump/restore times, snapshot comparison result and failures. Run focused application/runtime-role smoke checks in the isolated target under A's schedule, including append-only triggers, owner protection, catalog access and transaction rollback. Source/target equality alone does not establish that the original source was healthy. Have C independently review evidence before the gate can pass. Cleanup of the target/artifacts needs its own recorded ownership, retention policy and authorization; this harness never deletes them.

## Verification limits and failures

The SQL emits no individual data rows. It compares exact counts plus two order-independent sums of halves of MD5 row fingerprints. These detect ordinary content drift including same-count replacements, but are not cryptographic proof against adversarial collision or fabricated evidence. Archive SHA-256 and a real successful native restore are still required. Snapshots must come from trusted operator collection; offline JSON can be forged. UTC/ISO formatting and equal PostgreSQL majors make row representations reproducible.

Missing/changed migrations, RLS disabled, missing evidence, schema/ACL/trigger changes, ownerless active sellers, negative stock, invalid constraints and row drift fail closed. Investigate the protected inputs; do not edit ledger checksums or massage snapshots. A role lacking RLS bypass may report deceptively empty tables and is rejected. Missing native tools, TLS/identity privileges, connectivity, target authorization, backup protection/retention policy, platform recovery coverage, or a verified restore remain explicit blockers.

Local validation: `node node_modules/tsx/dist/cli.mjs --test tests/staging-recovery.test.ts`. These fixtures apply all migrations to PGlite and exercise the actual schema/content SQL, while substituting native identity/TLS evidence because PGlite cannot prove it.

## Independent-review corrections

C-R01: snapshot comparison now requires relevant role-membership edges (including grant options and role inheritance flags) and effective schema/table access for backend/browser roles. Direct and transitive browser-role grants are regression-tested using actual PostgreSQL catalogs in PGlite. Global role provisioning is still a separate operator step; reproduce the relevant membership graph without copying passwords.

C-R02: an active seller must have an owner whose user status is active. A suspended sole owner fails the invariant; restoring that user to active passes. These checks strengthen supplied-evidence validation and do not close the native restore gate.

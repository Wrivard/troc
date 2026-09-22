import assert from "node:assert/strict";
import { URL } from "node:url";
import { readdir, readFile } from "node:fs/promises";
import { migrationChecksums } from "../../lib/db/scripts/migration-checksum.mjs";

const local = (host) => ["localhost", "127.0.0.1", "::1"].includes(host);
const fail = (message) => {
  throw new Error(message);
};
export function endpointKey(e) {
  return `${e.host}:${e.port}/${e.database}`;
}
export function validatePlan(plan) {
  if (!plan || plan.version !== 1) fail("Use recovery plan version 1.");
  for (const side of ["source", "target"]) {
    const e = plan[side];
    if (
      !e ||
      Object.keys(e).some(
        (k) =>
          ![
            "host",
            "port",
            "database",
            "user",
            "systemIdentifier",
            "sslmode",
            "serverMajor",
          ].includes(k),
      )
    )
      fail(
        `${side}: unexpected connection fields; passwords/URLs are forbidden.`,
      );
    for (const field of ["host", "database", "user"])
      if (typeof e[field] !== "string" || !/^[a-zA-Z0-9_.:-]+$/.test(e[field]))
        fail(`${side}: invalid ${field}.`);
    if (!Number.isInteger(e.port) || e.port < 1 || e.port > 65535)
      fail(`${side}: invalid port.`);
    if (!/^\d{10,20}$/.test(e.systemIdentifier ?? ""))
      fail(`${side}: independently confirm the PostgreSQL system identifier.`);
    if (!Number.isInteger(e.serverMajor) || e.serverMajor < 14)
      fail(`${side}: record supported PostgreSQL major version.`);
    if (
      e.sslmode !== "verify-full" &&
      !(local(e.host) && e.sslmode === "disable")
    )
      fail(
        `${side}: remote connections require verify-full TLS and a trusted CA.`,
      );
  }
  if (
    endpointKey(plan.source) === endpointKey(plan.target) ||
    (plan.source.systemIdentifier === plan.target.systemIdentifier &&
      plan.source.database === plan.target.database)
  )
    fail("Source and target must be different databases, including aliases.");
  if (plan.source.serverMajor !== plan.target.serverMajor)
    fail("This bounded exercise requires matching PostgreSQL major versions.");
  if (
    !local(plan.target.host) &&
    plan.authorizedRemoteTarget !== endpointKey(plan.target)
  )
    fail(
      "Remote restore target requires an explicitly approved exact endpoint.",
    );
  if (
    plan.targetIsDisposable !== true ||
    typeof plan.authorizationReference !== "string" ||
    !plan.authorizationReference.trim()
  )
    fail(
      "Record the isolated disposable target and explicit exercise authorization.",
    );
  return plan;
}
export async function expectedMigrations(
  directory = new URL("../../lib/db/migrations/", import.meta.url),
) {
  return Promise.all(
    (await readdir(directory))
      .filter((n) => n.endsWith(".sql"))
      .sort()
      .map(async (name) => ({
        name,
        ...migrationChecksums(await readFile(new URL(name, directory), "utf8")),
      })),
  );
}
export function parseSnapshot(text) {
  const records = text
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const result = { rows: [] };
  for (const record of records) {
    if (record.kind === "row") result.rows.push(record.value);
    else {
      if (
        !["identity", "schema", "ledger", "invariants"].includes(record.kind) ||
        Object.hasOwn(result, record.kind)
      )
        fail("Unexpected or duplicate snapshot section.");
      result[record.kind] = record.value;
    }
  }
  return result;
}
function verifyIdentity(snapshot, expected) {
  const i = snapshot.identity;
  if (
    !i ||
    i.database !== expected.database ||
    i.systemIdentifier !== expected.systemIdentifier ||
    i.user !== expected.user ||
    i.serverMajor !== expected.serverMajor
  )
    fail("Observed database identity differs from approved plan.");
  if (!i.bypassRls)
    fail(
      "Snapshot role must bypass RLS to avoid a falsely empty backup verification.",
    );
  if (expected.sslmode === "verify-full" && !i.ssl)
    fail("Observed connection is not TLS.");
}
export function verifyBeforeRestore(plan, sourceProbe, targetProbe) {
  validatePlan(plan);
  verifyIdentity({ identity: sourceProbe }, plan.source);
  verifyIdentity({ identity: targetProbe }, plan.target);
  if (targetProbe.applicationObjects !== 0)
    fail(
      "Target already contains application objects; stop, do not clean or reset it.",
    );
  return {
    status: "IDENTITY_CHECK_ONLY",
    next: "Obtain operator approval of the native commands; this does not authorize a restore.",
  };
}
function verifySnapshot(snapshot, expected, migrations) {
  verifyIdentity(snapshot, expected);
  const ledger = snapshot.ledger;
  if (!Array.isArray(ledger) || ledger.length !== migrations.length)
    fail("Migration ledger is incomplete or unexpected.");
  for (const migration of migrations) {
    const found = ledger.filter((row) => row.name === migration.name);
    if (found.length !== 1 || !migration.accepted.has(found[0].checksum))
      fail("Migration checksum mismatch; preserve history and investigate.");
  }
  const tables = snapshot.schema?.tables;
  if (
    !Array.isArray(tables) ||
    tables.length === 0 ||
    !tables.every((t) => t.rls === true)
  )
    fail("Application table schema/RLS missing or disabled.");
  for (const key of [
    "columns",
    "constraints",
    "indexes",
    "triggers",
    "functions",
    "policies",
    "grants",
    "security",
    "effectiveAccess",
  ])
    if (!Array.isArray(snapshot.schema[key]) || !snapshot.schema[key].length)
      fail(`Schema ${key} evidence missing.`);
  if (!Array.isArray(snapshot.schema.memberships))
    fail("Role membership evidence missing.");
  const expectedTables = tables.map((t) => t.name).sort();
  if (new Set(expectedTables).size !== tables.length)
    fail("Duplicate schema tables.");
  assert.deepEqual(
    snapshot.rows.map((r) => r.table).sort(),
    expectedTables,
    "Every application table needs row evidence.",
  );
  for (const row of snapshot.rows)
    if (
      !/^\d+$/.test(row.count) ||
      !/^-?\d+$/.test(row.hash1) ||
      !/^-?\d+$/.test(row.hash2)
    )
      fail("Invalid row count/fingerprint.");
  const keys = [
    "ownerlessActiveSellers",
    "negativeInventory",
    "invalidConstraints",
  ];
  if (
    !snapshot.invariants ||
    keys.some((key) => snapshot.invariants[key] !== 0)
  )
    fail("Restored application invariant failed or was not measured.");
}
export function verifyRestore(plan, source, target, migrations) {
  validatePlan(plan);
  verifySnapshot(source, plan.source, migrations);
  verifySnapshot(target, plan.target, migrations);
  assert.deepEqual(
    target.schema,
    source.schema,
    "Restored schema/security differs from source.",
  );
  assert.deepEqual(
    target.ledger,
    source.ledger,
    "Restored migration history differs from source.",
  );
  assert.deepEqual(
    [...target.rows].sort((a, b) => a.table.localeCompare(b.table)),
    [...source.rows].sort((a, b) => a.table.localeCompare(b.table)),
    "Restored row counts/fingerprints differ from source.",
  );
  return {
    status: "PASS",
    scope:
      "Supplied application snapshots only; not proof of native restore execution or hosted Auth recovery",
    tables: source.rows.length,
    migrations: migrations.length,
  };
}

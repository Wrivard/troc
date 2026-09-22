import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import {
  validatePlan,
  expectedMigrations,
  parseSnapshot,
  verifyRestore,
  verifyBeforeRestore,
} from "../scripts/staging-recovery/verify.mjs";
import { toolVersions } from "../scripts/staging-recovery/cli.mjs";
test("CLI errors neither echo malformed credentials nor offer execution mode", async () => {
  const dir = await mkdtemp(join(tmpdir(), "troc-recovery-test-"));
  try {
    const path = join(dir, "plan.json");
    const marker = "PRIVATE_PASSWORD_SENTINEL";
    await writeFile(path, `{"password":"${marker}",broken`);
    const cli = fileURLToPath(
      new URL("../scripts/staging-recovery/cli.mjs", import.meta.url),
    );
    for (const mode of ["preflight", "restore"]) {
      const result = spawnSync(process.execPath, [cli, mode, path], {
        encoding: "utf8",
      });
      assert.equal(result.status, 1);
      assert.ok(!(result.stdout + result.stderr).includes(marker));
    }
  } finally {
    await rm(dir, { recursive: true });
  }
});
test("pre-restore rejects occupied targets, identity drift and missing TLS", () => {
  const p = plan();
  const source = {
    ...p.source,
    bypassRls: true,
    ssl: false,
    applicationObjects: 1,
  };
  const target = {
    ...p.target,
    bypassRls: true,
    ssl: false,
    applicationObjects: 0,
  };
  assert.equal(
    verifyBeforeRestore(p, source, target).status,
    "IDENTITY_CHECK_ONLY",
  );
  assert.throws(
    () => verifyBeforeRestore(p, source, { ...target, applicationObjects: 1 }),
    /already contains/,
  );
  assert.throws(
    () => verifyBeforeRestore(p, source, { ...target, database: "wrong" }),
    /identity/,
  );
  p.source.sslmode = "verify-full";
  assert.throws(() => verifyBeforeRestore(p, source, target), /TLS/);
});
const plan = () => ({
  version: 1,
  source: {
    host: "127.0.0.1",
    port: 5432,
    database: "source",
    user: "postgres",
    systemIdentifier: "1234567890123456789",
    sslmode: "disable",
    serverMajor: 17,
  },
  target: {
    host: "127.0.0.1",
    port: 5433,
    database: "restore",
    user: "postgres",
    systemIdentifier: "9876543210987654321",
    sslmode: "disable",
    serverMajor: 17,
  },
  targetIsDisposable: true,
  authorizationReference: "LOCAL SYNTHETIC TEST ONLY",
});
test("recovery refuses same database, aliases, remote target without approval, credentials and weak TLS", () => {
  assert.ok(validatePlan(plan()));
  const same = plan();
  same.target = { ...same.source };
  assert.throws(() => validatePlan(same), /different/);
  const alias = plan();
  alias.target.systemIdentifier = alias.source.systemIdentifier;
  alias.target.database = alias.source.database;
  assert.throws(() => validatePlan(alias), /different/);
  const remote = plan();
  remote.target.host = "staging.example.test";
  assert.throws(() => validatePlan(remote), /TLS/);
  remote.target.sslmode = "verify-full";
  assert.throws(() => validatePlan(remote), /approved/);
  assert.throws(
    () => validatePlan({ ...plan(), targetIsDisposable: false }),
    /disposable/,
  );
  assert.throws(
    () =>
      validatePlan({
        ...plan(),
        source: { ...plan().source, password: "must-not-log" },
      }),
    /forbidden/,
  );
  assert.throws(
    () =>
      validatePlan({
        ...plan(),
        source: { ...plan().source, host: "host; malicious" },
      }),
    /invalid host/,
  );
});
test("native tool detection never invokes a database command and fails closed", () => {
  const calls: string[] = [];
  const run = (tool: string, args: string[]) => {
    assert.deepEqual(args, ["--version"]);
    calls.push(tool);
    return { status: 0, stdout: `${tool} (PostgreSQL) 17.4` };
  };
  assert.ok(toolVersions(17, run).every((t) => t.status === "PASS"));
  assert.deepEqual(calls, ["psql", "pg_dump", "pg_restore"]);
  assert.ok(
    toolVersions(17, () => ({ status: null })).every(
      (t) => t.status === "BLOCKED",
    ),
  );
  assert.ok(toolVersions(16, run).every((t) => t.status === "BLOCKED"));
});
test("real local schema and data evidence detects restore drift; not a native restore", async () => {
  const db = new PGlite({ extensions: { pg_trgm } });
  const migrations = await expectedMigrations();
  try {
    await db.exec(
      "CREATE TABLE public.troc_migrations(name text PRIMARY KEY,checksum text NOT NULL)",
    );
    for (const m of migrations) {
      await db.exec(
        await readFile(
          new URL(`../lib/db/migrations/${m.name}`, import.meta.url),
          "utf8",
        ),
      );
      await db.query("INSERT INTO public.troc_migrations VALUES($1,$2)", [
        m.name,
        m.checksum,
      ]);
    }
    await db.exec(
      "INSERT INTO troc.users(id,email) VALUES('00000000-0000-4000-8000-000000000001','synthetic@example.test')",
    );
    await db.exec("CREATE ROLE authenticated; CREATE ROLE recovery_bridge;");
    const sql = await readFile(
      new URL("../scripts/staging-recovery/snapshot.sql", import.meta.url),
      "utf8",
    );
    // PGlite has no native server/TLS identity. Substitute ONLY identity evidence.
    const start = sql.indexOf("SELECT jsonb_build_object('kind','schema'");
    const dynamic = sql.indexOf("SELECT format(");
    async function capture() {
      const records: unknown[] = [];
      await db.exec(
        "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY; SET LOCAL search_path=pg_catalog; SET LOCAL timezone='UTC'; SET LOCAL datestyle='ISO, YMD'; SET LOCAL extra_float_digits=3;",
      );
      try {
        const results = await db.exec(sql.slice(start, dynamic));
        for (const result of results)
          for (const row of result.rows) records.push(Object.values(row)[0]);
        const generated = await db.query<Record<string, string>>(
          sql.slice(dynamic, sql.indexOf("\\gexec")),
        );
        for (const row of generated.rows)
          for (const query of Object.values(row))
            records.push(Object.values((await db.query(query)).rows[0])[0]);
      } finally {
        await db.exec("ROLLBACK");
      }
      const snapshot = parseSnapshot(
        records.map((r) => JSON.stringify(r)).join("\n"),
      );
      snapshot.identity = { ...plan().source, bypassRls: true, ssl: false };
      return snapshot;
    }
    const source = await capture();
    const target = structuredClone(source);
    target.identity = { ...plan().target, bypassRls: true, ssl: false };
    assert.equal(
      verifyRestore(plan(), source, target, migrations).status,
      "PASS",
    );
    assert.equal(source.rows.length, 67);
    for (const grant of [
      "GRANT troc_backend TO authenticated",
      "GRANT troc_backend TO recovery_bridge; GRANT recovery_bridge TO authenticated",
    ]) {
      await db.exec(grant);
      const escalated = await capture();
      escalated.identity = target.identity;
      assert.equal(
        (
          await db.query(
            "SELECT has_schema_privilege('authenticated','troc','USAGE') access",
          )
        ).rows[0].access,
        true,
      );
      assert.throws(
        () => verifyRestore(plan(), source, escalated, migrations),
        /schema\/security/,
      );
      await db.exec(
        "REVOKE troc_backend FROM authenticated; REVOKE recovery_bridge FROM authenticated; REVOKE troc_backend FROM recovery_bridge",
      );
    }
    await db.exec(
      "INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status) VALUES('00000000-0000-4000-8000-000000000002','restore-owner-fixture','Fixture','individual','active'); INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','owner'); UPDATE troc.users SET status='suspended' WHERE id='00000000-0000-4000-8000-000000000001';",
    );
    const suspended = await capture();
    assert.equal(suspended.invariants.ownerlessActiveSellers, 1);
    const suspendedTarget = structuredClone(suspended);
    suspendedTarget.identity = target.identity;
    assert.throws(
      () => verifyRestore(plan(), suspended, suspendedTarget, migrations),
      /invariant/,
    );
    await db.exec(
      "UPDATE troc.users SET status='active' WHERE id='00000000-0000-4000-8000-000000000001'",
    );
    const active = await capture();
    assert.equal(active.invariants.ownerlessActiveSellers, 0);
    const activeTarget = structuredClone(active);
    activeTarget.identity = target.identity;
    assert.equal(
      verifyRestore(plan(), active, activeTarget, migrations).status,
      "PASS",
    );
    await db.exec(
      "DELETE FROM troc.seller_members WHERE seller_id='00000000-0000-4000-8000-000000000002'; DELETE FROM troc.seller_accounts WHERE id='00000000-0000-4000-8000-000000000002'",
    );
    for (const mutate of [
      (s) => {
        s.ledger.pop();
      },
      (s) => {
        s.ledger[0].checksum = "0".repeat(64);
      },
      (s) => {
        s.schema.tables[0].rls = false;
      },
      (s) => {
        s.schema.triggers.pop();
      },
      (s) => {
        s.rows.pop();
      },
      (s) => {
        s.identity.bypassRls = false;
      },
      (s) => {
        s.identity.systemIdentifier = plan().source.systemIdentifier;
      },
      (s) => {
        s.invariants.ownerlessActiveSellers = 1;
      },
    ]) {
      const bad = structuredClone(target);
      mutate(bad);
      assert.throws(() => verifyRestore(plan(), source, bad, migrations));
    }
    await db.exec(
      "UPDATE troc.users SET email='changed@example.test' WHERE id='00000000-0000-4000-8000-000000000001'",
    );
    const changed = await capture();
    changed.identity = target.identity;
    assert.throws(
      () => verifyRestore(plan(), source, changed, migrations),
      /fingerprints/,
    );
    assert.throws(
      () =>
        parseSnapshot(
          '{"kind":"identity","value":{}}\n{"kind":"identity","value":{}}',
        ),
      /duplicate/,
    );
  } finally {
    await db.close();
  }
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  BUDGET,
  PROJECT,
  connectionOptions,
  validateWindow,
  transaction,
  barrier,
  errorClass,
} from "../scripts/staging-concurrency/guards.mjs";
import {
  run,
  identity,
  fixtures,
} from "../scripts/staging-concurrency/run.mjs";
const env = {
  SUPABASE_URL: `https://${PROJECT}.supabase.co`,
  DATABASE_URL: `postgres://troc_staging_runtime:SECRET@db.${PROJECT}.supabase.co/postgres?sslmode=disable&sslrootcert=SECRET&options=SECRET`,
  STAGING_OBSERVER_DATABASE_URL: `postgres://troc_staging_observer:SECRET@db.${PROJECT}.supabase.co/postgres`,
};
const candidate = "a".repeat(40);
const window = () => ({
  approvedBy: "A",
  project: PROJECT,
  candidate,
  startsAt: new Date(Date.now() - 1000).toISOString(),
  endsAt: new Date(Date.now() + 300000).toISOString(),
  runId: randomUUID(),
  cleanupOwner: "A",
  preserveAudit: true,
  allowClientDisconnect: true,
  budget: { ...BUDGET },
  ids: Object.fromEntries(
    [
      "admin",
      "ownerA",
      "ownerB",
      "target",
      "applicant",
      "staleAdmin",
      "staleMember",
      "application",
      "seller",
      "auditProbe",
    ].map((key) => [key, randomUUID()]),
  ),
});
const goodIdentity = {
  role: "troc_staging_runtime",
  login: "troc_staging_runtime",
  database: "postgres",
  pid: 100,
  ssl: true,
  backend: true,
  restricted: true,
  safe_memberships: true,
  no_create: true,
  tables: 67,
  unsafe_tables: 0,
};
function fake(overrides = {}) {
  const calls = [];
  const client = {
    connect: async () => {
      calls.push("connect");
    },
    query: async (sql) => {
      calls.push(sql);
      return { rows: [goodIdentity] };
    },
    end: async () => {
      calls.push("end");
    },
    ...overrides,
  };
  return { client, calls };
}
test("target and TLS guard strips all pg URL overrides, rejects cross-project/admin/transaction-pool URLs", () => {
  const options = connectionOptions(env);
  assert.equal(new URL(options.connectionString).search, "");
  assert.deepEqual(options.ssl, { rejectUnauthorized: true });
  assert.equal(options.statement_timeout, 5000);
  assert.equal(options.lock_timeout, 2000);
  for (const url of [
    "postgres://postgres:x@db." + PROJECT + ".supabase.co/postgres",
    env.DATABASE_URL.replace(PROJECT, "wrong"),
    env.DATABASE_URL.replace("/postgres", "/other"),
    env.DATABASE_URL.replace("/postgres", ":6543/postgres"),
    "postgres://troc_staging_runtime." +
      PROJECT +
      ":x@region.pooler.supabase.com:6543/postgres",
  ])
    assert.throws(() => connectionOptions({ ...env, DATABASE_URL: url }), {
      code: "target_blocked",
    });
  assert.throws(
    () => connectionOptions({ ...env, SUPABASE_URL: "https://wrong.invalid" }),
    { code: "target_blocked" },
  );
  assert.equal(
    connectionOptions({
      ...env,
      STAGING_POOLER_HOST: "region.pooler.supabase.com",
      DATABASE_URL: `postgres://troc_staging_runtime.${PROJECT}:x@region.pooler.supabase.com:5432/postgres`,
    }).ssl.rejectUnauthorized,
    true,
  );
});
test("expired, excessive, mismatched, unapproved and unsafe fixture windows fail before connection", async () => {
  const changes = [
    { approvedBy: "D" },
    { candidate: "b".repeat(40) },
    { endsAt: new Date(Date.now() - 1).toISOString() },
    { endsAt: new Date(Date.now() + 1000000).toISOString() },
    { cleanupOwner: "D" },
    { preserveAudit: false },
    { allowClientDisconnect: false },
    { budget: { ...BUDGET, connections: 5 } },
    { ids: {} },
  ];
  for (const change of changes) {
    let connections = 0;
    const result = await run({
      env,
      execute: true,
      manifest: { ...window(), ...change },
      candidate,
      createClient: () => {
        connections++;
        throw new Error("SECRET");
      },
    });
    assert.equal(result.status, "blocked");
    assert.equal(connections, 0);
    assert.ok(!JSON.stringify(result).includes("SECRET"));
  }
  assert.equal(validateWindow(window(), candidate).candidate, candidate);
});
test("default preflight opens one read-only connection, checks actual identity and closes", async () => {
  const { client, calls } = fake();
  const report = await run({ env, candidate, createClient: () => client });
  assert.equal(report.status, "pass");
  assert.equal(report.connections.length, 1);
  assert.equal(calls[1], "BEGIN READ ONLY");
  assert.deepEqual(calls.slice(-2), ["ROLLBACK", "end"]);
  assert.ok(!calls.some((sql) => /^(INSERT|UPDATE|DELETE)/.test(sql)));
  assert.ok(!JSON.stringify(report).includes("SECRET"));
  assert.equal(report.capacity, "NOT_TESTED");
});
test("role ownership/TLS/identity anomalies fail closed", async () => {
  for (const override of [
    { unsafe_tables: 1 },
    { ssl: false },
    { role: "postgres" },
    { login: "postgres" },
    { restricted: false },
    { tables: 0 },
    { pid: null },
  ])
    await assert.rejects(() =>
      identity({
        query: async () => ({ rows: [{ ...goodIdentity, ...override }] }),
      }),
    );
});
test("connect, query and cleanup failures redact raw driver data", async () => {
  for (const stage of ["connect", "query", "end"]) {
    let ended = 0;
    const { client } = fake({
      [stage]: async () => {
        if (stage === "end") ended++;
        throw Object.assign(new Error("SECRET pii@example.invalid"), {
          code: "28P01",
        });
      },
      ...(stage === "end"
        ? {}
        : {
            end: async () => {
              ended++;
            },
          }),
    });
    const report = await run({ env, candidate, createClient: () => client });
    assert.equal(report.status, "fail");
    assert.equal(ended, 1);
    assert.ok(!JSON.stringify(report).includes("SECRET"));
    assert.ok(!JSON.stringify(report).includes("pii@"));
  }
});
test("transaction rollback is reliable and rollback failure cannot become a passing expected error", async () => {
  const calls = [];
  const client = {
    query: async (sql) => {
      calls.push(sql);
      return { rows: [] };
    },
  };
  await assert.rejects(
    () =>
      transaction(client, async () => {
        throw Object.assign(new Error("x"), { code: "controlled_failure" });
      }),
    { code: "controlled_failure" },
  );
  assert.equal(calls.at(-1), "ROLLBACK");
  assert.ok(!calls.includes("COMMIT"));
  await assert.rejects(
    () =>
      transaction(
        {
          query: async (sql) => {
            if (sql === "ROLLBACK") throw new Error("SECRET");
            return { rows: [] };
          },
        },
        async () => {
          throw Object.assign(new Error("x"), { code: "55P03" });
        },
      ),
    { code: "cleanup_failed" },
  );
  assert.equal(errorClass(new Error("SECRET")), "unexpected_failure");
});
test("two-party start barrier holds first transaction until second arrives", async () => {
  const gate = barrier();
  let firstReleased = false;
  const first = gate().then(() => {
    firstReleased = true;
  });
  await Promise.resolve();
  assert.equal(firstReleased, false);
  await Promise.all([first, gate()]);
  assert.equal(firstReleased, true);
});
test("fixture guard refuses an unrelated user before any mutations", async () => {
  const calls = [];
  await assert.rejects(
    () =>
      fixtures(
        {
          query: async (sql) => {
            calls.push(sql);
            return {
              rows: [{ email: "real@example.invalid", status: "active" }],
            };
          },
        },
        window(),
      ),
    { code: "fixture_blocked" },
  );
  assert.equal(calls.length, 1);
  assert.ok(calls.every((sql) => sql.startsWith("SELECT")));
});
test("unsafe fixture manifest execution cannot progress beyond read-only validation", async () => {
  const calls = [];
  const result = await run({
    env,
    execute: true,
    manifest: window(),
    candidate,
    createClient: (options) => ({
      connect: async () => {},
      end: async () => {
        calls.push("end");
      },
      query: async (sql) => {
        calls.push(sql);
        const observer = options.connectionString.includes(
          "troc_staging_observer",
        );
        return {
          rows: sql.includes("pg_roles")
            ? [
                {
                  ...goodIdentity,
                  ...(observer
                    ? {
                        role: "troc_staging_observer",
                        login: "troc_staging_observer",
                        pid: 101,
                        backend: false,
                        backend_member: false,
                        audit_read: true,
                        writable_tables: 0,
                      }
                    : {}),
                },
              ]
            : [],
        };
      },
    }),
  });
  assert.equal(result.status, "fail");
  assert.equal(result.failure, "fixture_blocked");
  assert.ok(!calls.some((sql) => /^(INSERT|UPDATE|DELETE)/.test(sql)));
  assert.equal(calls.at(-1), "end");
});

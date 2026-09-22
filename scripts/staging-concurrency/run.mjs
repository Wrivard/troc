import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  BUDGET,
  PROJECT,
  connectionOptions,
  validateWindow,
  requireCheck,
  errorClass,
  transaction,
  barrier,
  closeClient,
} from "./guards.mjs";

const identitySql = `SELECT current_user AS role, session_user AS login, pg_backend_pid() AS pid,
  current_database() AS database, (SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()) AS ssl,
  pg_has_role(current_user,'troc_backend','USAGE') AS backend,
  pg_has_role(current_user,'troc_backend','MEMBER') AS backend_member,
  NOT (rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication) AS restricted,
  NOT EXISTS (SELECT 1 FROM pg_roles r WHERE (r.rolsuper OR r.rolbypassrls OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication) AND pg_has_role(current_user,r.oid,'MEMBER')) AS safe_memberships,
  NOT has_schema_privilege(current_user,'troc','CREATE') AS no_create,
  has_table_privilege(current_user,'troc.audit_events','SELECT') AS audit_read,
  (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='troc' AND c.relkind='r' AND (has_table_privilege(current_user,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,TRIGGER,REFERENCES') OR has_any_column_privilege(current_user,c.oid,'INSERT,UPDATE,REFERENCES'))) AS writable_tables,
  (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='troc' AND c.relkind='r') AS tables,
  (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='troc' AND c.relkind='r' AND
   (NOT c.relrowsecurity OR pg_has_role(current_user,c.relowner,'MEMBER'))) AS unsafe_tables
  FROM pg_roles WHERE rolname=current_user`;

export async function identity(client, role = "troc_staging_runtime") {
  const row = (await client.query(identitySql)).rows[0];
  requireCheck(
    row &&
      row.role === role &&
      row.login === row.role &&
      row.database === "postgres" &&
      row.restricted === true &&
      row.safe_memberships === true &&
      row.no_create === true &&
      row.tables >= 67 &&
      row.unsafe_tables === 0,
    "role_blocked",
  );
  requireCheck(
    role === "troc_staging_runtime"
      ? row.backend === true
      : row.backend === false &&
          row.backend_member === false &&
          row.audit_read === true &&
          row.writable_tables === 0,
    "role_blocked",
  );
  requireCheck(row.ssl === true, "tls_blocked");
  requireCheck(Number.isInteger(row.pid) && row.pid > 0, "identity_changed");
  return { role: row.role, login: row.login, pid: row.pid };
}

export async function fixtures(client, manifest, observer = client) {
  const { ids, runId } = manifest;
  for (const name of [
    "admin",
    "ownerA",
    "ownerB",
    "target",
    "applicant",
    "staleAdmin",
    "staleMember",
  ]) {
    const row = (
      await client.query("SELECT email,status FROM troc.users WHERE id=$1", [
        ids[name],
      ])
    ).rows[0];
    requireCheck(
      row?.email === `troc-d-${runId}-${name.toLowerCase()}@example.invalid` &&
        row.status === "active",
      "fixture_blocked",
    );
  }
  const admins = (
    await client.query(
      "SELECT user_id FROM troc.user_roles WHERE user_id=ANY($1::uuid[]) AND role='admin'",
      [[ids.admin, ids.staleAdmin]],
    )
  ).rows;
  requireCheck(
    admins.length === 1 && admins[0].user_id === ids.admin,
    "fixture_blocked",
  );
  const app = (
    await client.query(
      "SELECT applicant_id,status,seller_id,contact_name FROM troc.seller_applications WHERE id=$1",
      [ids.application],
    )
  ).rows[0];
  requireCheck(
    app?.applicant_id === ids.applicant &&
      app.status === "submitted" &&
      app.seller_id === null &&
      app.contact_name === `troc-d-${runId}`,
    "fixture_blocked",
  );
  requireCheck(
    (
      await client.query(
        "SELECT count(*)::int AS n FROM troc.seller_members WHERE user_id=$1",
        [ids.applicant],
      )
    ).rows[0]?.n === 0,
    "fixture_blocked",
  );
  const seller = (
    await client.query(
      "SELECT slug,status FROM troc.seller_accounts WHERE id=$1",
      [ids.seller],
    )
  ).rows[0];
  requireCheck(
    seller?.slug === `troc-d-${runId}` && seller.status === "active",
    "fixture_blocked",
  );
  const members = (
    await client.query(
      "SELECT user_id,role FROM troc.seller_members WHERE seller_id=$1",
      [ids.seller],
    )
  ).rows;
  requireCheck(
    members.length === 3 &&
      members.some((m) => m.user_id === ids.ownerA && m.role === "owner") &&
      members.some((m) => m.user_id === ids.ownerB && m.role === "owner") &&
      members.some((m) => m.user_id === ids.target && m.role === "inventory"),
    "fixture_blocked",
  );
  const audit = (
    await observer.query(
      "SELECT count(*)::int AS n FROM troc.audit_events WHERE entity_id=ANY($1::uuid[])",
      [[ids.application, ids.seller]],
    )
  ).rows[0];
  requireCheck(audit?.n === 0, "fixture_blocked");
  const probe = (
    await observer.query(
      "SELECT count(*)::int AS n FROM troc.audit_events WHERE id=$1 AND entity_id=$2 AND action='staging.fixture.created' AND actor_id=$3",
      [ids.auditProbe, runId, ids.admin],
    )
  ).rows[0];
  requireCheck(probe?.n === 1, "fixture_blocked");
}

export async function run({
  env = {},
  manifest,
  candidate,
  execute = false,
  createClient,
  Service,
}) {
  const report = {
    status: "blocked",
    project: PROJECT,
    candidate,
    mode: execute ? "execute" : "preflight",
    budget: BUDGET,
    connections: [],
    outcomes: [],
    failure: null,
    cleanup: "not_needed",
    capacity: "NOT_TESTED",
    networkFault: "NOT_TESTED",
    authCookies: "NOT_TESTED",
  };
  const clients = [];
  let queries = 0,
    timer,
    asynchronousFailure,
    mutationStarted = false;
  const start = performance.now();
  const stopped = () =>
    asynchronousFailure || performance.now() - start >= BUDGET.runMs;
  const connect = async (options, role = "troc_staging_runtime") => {
    requireCheck(clients.length < BUDGET.connections, "budget_blocked");
    const raw = createClient(options);
    const entry = { raw, closed: false, id: null };
    clients.push(entry);
    raw.on?.("error", () => {
      asynchronousFailure = true;
    });
    await raw.connect();
    entry.query = async (sql, params) => {
      if (sql !== "ROLLBACK") {
        requireCheck(!stopped(), "run_deadline");
        requireCheck(++queries <= BUDGET.queries, "query_budget");
      }
      return raw.query(sql, params);
    };
    entry.end = async () => {
      await closeClient(raw);
      entry.closed = true;
    };
    await entry.query("BEGIN READ ONLY");
    try {
      entry.id = await identity(entry, role);
    } finally {
      await entry.query("ROLLBACK");
    }
    report.connections.push(entry.id);
    return entry;
  };
  try {
    const options = connectionOptions(env);
    if (execute) validateWindow(manifest, candidate);
    const observerOptions = execute
      ? connectionOptions(
          { ...env, DATABASE_URL: env.STAGING_OBSERVER_DATABASE_URL },
          "troc_staging_observer",
        )
      : null;
    timer = setTimeout(() => {
      asynchronousFailure = true;
      for (const c of clients) void c.raw.end().catch(() => {});
    }, BUDGET.runMs);
    const first = await connect(options);
    if (!execute) {
      report.status = "pass";
      return report;
    }
    const observer = await connect(observerOptions, "troc_staging_observer");
    await observer.query("BEGIN READ ONLY");
    await transaction(first, async (db) => {
      await db.query("SET TRANSACTION READ ONLY");
      await fixtures(db, manifest, observer);
    });
    const second = await connect(options);
    requireCheck(
      new Set(clients.map((c) => c.id.pid)).size === BUDGET.connections,
      "identity_changed",
    );
    const { ids } = manifest;
    const principal = (userId) => ({
      userId,
      roles: ["admin"],
      memberships: [{ sellerId: ids.seller, role: "owner" }],
    });
    const service = (client, hook, gate) =>
      new Service(client, {
        transaction: (work) =>
          transaction(
            client,
            async (db) => {
              if (gate) await gate();
              return work(db);
            },
            hook,
          ),
      });
    const a = service(first),
      b = service(second);
    const measure = async (name, client, work, accepted = ["ok"]) => {
      const started = performance.now();
      let result,
        outcome = "ok";
      try {
        result = await work();
      } catch (error) {
        outcome = errorClass(error);
      }
      report.outcomes.push({
        name,
        pid: client.id.pid,
        outcome,
        durationMs: Math.round((performance.now() - started) * 100) / 100,
        accepted: accepted.includes(outcome),
      });
      requireCheck(accepted.includes(outcome), "invariant_failed");
      return { outcome, result };
    };
    const pair = async (jobs) => {
      const settled = await Promise.allSettled(jobs);
      const failure = settled.find((x) => x.status === "rejected");
      if (failure) throw failure.reason;
      return settled.map((x) => x.value);
    };
    const stableIdentity = async () => {
      for (const c of clients.filter((c) => !c.closed))
        requireCheck(
          (await identity(c, c.id.role)).pid === c.id.pid,
          "identity_changed",
        );
      requireCheck(
        Date.now() < Date.parse(manifest.endsAt) && !stopped(),
        "run_deadline",
      );
    };
    const state = async () => {
      const members = (
        await first.query(
          "SELECT user_id,role FROM troc.seller_members WHERE seller_id=$1 ORDER BY user_id",
          [ids.seller],
        )
      ).rows;
      const audit = (
        await observer.query(
          "SELECT count(*)::int AS n FROM troc.audit_events WHERE entity_id=$1",
          [ids.seller],
        )
      ).rows[0].n;
      return JSON.stringify({ members, audit });
    };
    const verifyTarget = async (before, role, auditDelta) => {
      const prior = JSON.parse(before),
        after = JSON.parse(await state());
      requireCheck(
        after.audit === prior.audit + auditDelta &&
          after.members.some(
            (m) => m.user_id === ids.target && m.role === role,
          ),
        "invariant_failed",
      );
      requireCheck(
        JSON.stringify(
          after.members.filter((m) => m.user_id !== ids.target),
        ) ===
          JSON.stringify(prior.members.filter((m) => m.user_id !== ids.target)),
        "invariant_failed",
      );
    };
    mutationStarted = true;
    await stableIdentity();
    const approvalGate = barrier();
    const approvals = await pair([
      measure(
        "duplicate_approval_a",
        first,
        () =>
          service(first, undefined, approvalGate).review(
            principal(ids.admin),
            ids.application,
            { decision: "approved", note: "D synthetic validation" },
          ),
        ["ok", "application_already_reviewed"],
      ),
      measure(
        "duplicate_approval_b",
        second,
        () =>
          service(second, undefined, approvalGate).review(
            principal(ids.admin),
            ids.application,
            { decision: "approved", note: "D synthetic validation" },
          ),
        ["ok", "application_already_reviewed"],
      ),
    ]);
    requireCheck(
      approvals.filter((x) => x.outcome === "ok").length === 1,
      "invariant_failed",
    );
    const approved = (
      await first.query(
        `SELECT s.id,
      (SELECT count(*)::int FROM troc.seller_members m WHERE m.seller_id=s.id AND m.user_id=$2 AND m.role='owner') AS owners,
      (SELECT count(*)::int FROM troc.seller_settings x WHERE x.seller_id=s.id) AS settings,
      (SELECT count(*)::int FROM troc.seller_verification_status x WHERE x.seller_id=s.id) AS verification
      FROM troc.seller_applications a JOIN troc.seller_accounts s ON s.id=a.seller_id WHERE a.id=$1 AND a.status='approved'`,
        [ids.application, ids.applicant],
      )
    ).rows;
    const approvalAudits = (
      await observer.query(
        "SELECT count(*)::int AS n FROM troc.audit_events WHERE entity_id=$1 AND action='seller.application.approved'",
        [ids.application],
      )
    ).rows[0].n;
    requireCheck(
      approved.length === 1 &&
        ["owners", "settings", "verification"].every(
          (key) => approved[0][key] === 1,
        ) &&
        approvalAudits === 1,
      "invariant_failed",
    );
    requireCheck(
      (
        await first.query(
          "SELECT count(*)::int AS n FROM troc.seller_members WHERE user_id=$1",
          [ids.applicant],
        )
      ).rows[0].n === 1,
      "invariant_failed",
    );
    await stableIdentity();
    const ownerGate = barrier();
    const owners = await pair([
      measure(
        "owner_contention_a",
        first,
        () =>
          service(first, undefined, ownerGate).member(
            principal(ids.ownerA),
            ids.seller,
            { userId: ids.ownerB, role: "manager" },
          ),
        ["ok", "forbidden", "last_owner"],
      ),
      measure(
        "owner_contention_b",
        second,
        () =>
          service(second, undefined, ownerGate).member(
            principal(ids.ownerB),
            ids.seller,
            { userId: ids.ownerA, role: "manager" },
          ),
        ["ok", "forbidden", "last_owner"],
      ),
    ]);
    requireCheck(
      owners.filter((x) => x.outcome === "ok").length === 1,
      "invariant_failed",
    );
    const remaining = (
      await first.query(
        "SELECT user_id FROM troc.seller_members WHERE seller_id=$1 AND role='owner'",
        [ids.seller],
      )
    ).rows;
    requireCheck(
      remaining.length === 1 &&
        [ids.ownerA, ids.ownerB].includes(remaining[0].user_id),
      "invariant_failed",
    );
    await a.member(principal(remaining[0].user_id), ids.seller, {
      userId: remaining[0].user_id === ids.ownerA ? ids.ownerB : ids.ownerA,
      role: "owner",
    });
    const beforeStale = await state();
    await measure(
      "stale_admin_request",
      first,
      () =>
        a.review(principal(ids.staleAdmin), ids.application, {
          decision: "approved",
          note: "D stale claims",
        }),
      ["forbidden"],
    );
    await measure(
      "stale_member_request",
      first,
      () =>
        a.member(principal(ids.staleMember), ids.seller, {
          userId: ids.target,
          role: "manager",
        }),
      ["forbidden"],
    );
    requireCheck((await state()) === beforeStale, "invariant_failed");
    await stableIdentity();
    const beforeLock = await state();
    await first.query("BEGIN");
    try {
      await first.query(
        "SELECT id FROM troc.seller_accounts WHERE id=$1 FOR UPDATE",
        [ids.seller],
      );
      await measure(
        "held_lock_timeout",
        second,
        () =>
          b.member(principal(ids.ownerA), ids.seller, {
            userId: ids.target,
            role: "manager",
          }),
        ["55P03"],
      );
    } finally {
      await first.query("ROLLBACK");
    }
    requireCheck((await state()) === beforeLock, "invariant_failed");
    await measure("held_lock_retry", second, () =>
      b.member(principal(ids.ownerA), ids.seller, {
        userId: ids.target,
        role: "manager",
      }),
    );
    await verifyTarget(beforeLock, "manager", 1);
    await a.member(principal(ids.ownerA), ids.seller, {
      userId: ids.target,
      role: "inventory",
    });
    await verifyTarget(beforeLock, "inventory", 2);
    const beforeRollback = await state();
    const injected = service(second, async (sql) => {
      if (sql.startsWith("INSERT INTO troc.audit_events"))
        requireCheck(false, "controlled_failure");
    });
    await measure(
      "controlled_rollback",
      second,
      () =>
        injected.member(principal(ids.ownerA), ids.seller, {
          userId: ids.target,
          role: "manager",
        }),
      ["controlled_failure"],
    );
    requireCheck((await state()) === beforeRollback, "invariant_failed");
    await measure("controlled_retry", second, () =>
      b.member(principal(ids.ownerA), ids.seller, {
        userId: ids.target,
        role: "manager",
      }),
    );
    await verifyTarget(beforeRollback, "manager", 1);
    await a.member(principal(ids.ownerA), ids.seller, {
      userId: ids.target,
      role: "inventory",
    });
    await verifyTarget(beforeRollback, "inventory", 2);
    await stableIdentity();
    const beforeDisconnect = await state();
    const disconnected = service(second, async (sql) => {
      if (sql.startsWith("INSERT INTO troc.audit_events")) {
        await second.end();
        requireCheck(false, "client_disconnected");
      }
    });
    await measure(
      "client_disconnect_before_audit",
      second,
      () =>
        disconnected.member(principal(ids.ownerA), ids.seller, {
          userId: ids.target,
          role: "manager",
        }),
      ["client_disconnected"],
    );
    requireCheck((await state()) === beforeDisconnect, "invariant_failed");
    await measure("disconnect_retry_surviving_client", first, () =>
      a.member(principal(ids.ownerA), ids.seller, {
        userId: ids.target,
        role: "manager",
      }),
    );
    await verifyTarget(beforeDisconnect, "manager", 1);
    await a.member(principal(ids.ownerA), ids.seller, {
      userId: ids.target,
      role: "inventory",
    });
    await verifyTarget(beforeDisconnect, "inventory", 2);
    requireCheck(!stopped(), "run_deadline");
    report.status = "pass";
  } catch (error) {
    report.failure = errorClass(error);
    report.status = clients.length ? "fail" : "blocked";
  } finally {
    clearTimeout(timer);
    const closed = await Promise.allSettled(
      clients.filter((c) => !c.closed).map((c) => closeClient(c.raw)),
    );
    if (closed.some((c) => c.status === "rejected")) {
      report.status = "fail";
      report.failure = "cleanup_failed";
    }
    report.cleanup = closed.some((c) => c.status === "rejected")
      ? "connection_close_failed_A_inspection_required"
      : mutationStarted
        ? "A_fixture_retirement_required_audit_preserved"
        : "connections_closed_no_fixture_mutation";
    report.queryCount = queries;
    report.durationMs = Math.round((performance.now() - start) * 100) / 100;
    report.rssBytes = process.memoryUsage().rss;
    const durations = report.outcomes
      .map((x) => x.durationMs)
      .sort((a, b) => a - b);
    report.metrics = {
      operations: durations.length,
      unexpectedOutcomes: report.outcomes.filter((x) => !x.accepted).length,
      p50Ms: durations.length
        ? durations[Math.ceil(durations.length * 0.5) - 1]
        : null,
      p95Ms: durations.length
        ? durations[Math.ceil(durations.length * 0.95) - 1]
        : null,
      maxMs: durations.at(-1) ?? null,
    };
  }
  return report;
}

async function main() {
  try {
    const args = process.argv.slice(2);
    requireCheck(
      args.length === 0 || (args.length === 2 && args[0] === "--execute"),
      "window_blocked",
    );
    const execute = args.length > 0;
    const candidate = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: fileURLToPath(new URL("../..", import.meta.url)),
      encoding: "utf8",
    }).trim();
    if (execute)
      requireCheck(
        execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], {
          cwd: fileURLToPath(new URL("../..", import.meta.url)),
          encoding: "utf8",
        }).trim() === "",
        "window_blocked",
      );
    // Validate target/window BEFORE resolving dependencies or constructing connections.
    connectionOptions(process.env);
    const manifest = execute
      ? JSON.parse(await readFile(args[1], "utf8"))
      : undefined;
    if (execute) validateWindow(manifest, candidate);
    if (execute)
      connectionOptions(
        {
          ...process.env,
          DATABASE_URL: process.env.STAGING_OBSERVER_DATABASE_URL,
        },
        "troc_staging_observer",
      );
    const require = createRequire(
      new URL("../../lib/db/package.json", import.meta.url),
    );
    const { Client } = require("pg");
    const Service = execute
      ? (
          await import("../../artifacts/api-server/src/modules/seller-platform/service.ts")
        ).SellerPlatformService
      : undefined;
    const report = await run({
      env: process.env,
      manifest,
      candidate,
      execute,
      createClient: (options) => new Client(options),
      Service,
    });
    console.log(JSON.stringify(report, null, 2));
    process.exitCode =
      report.status === "pass" ? 0 : report.status === "blocked" ? 2 : 1;
  } catch (error) {
    console.log(
      JSON.stringify({ status: "blocked", failure: errorClass(error) }),
    );
    process.exitCode = 2;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  void main();

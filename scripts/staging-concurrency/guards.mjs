export const PROJECT = "wcpsyflzqaeorxaejaqh";
export const BUDGET = Object.freeze({
  connections: 3,
  statementMs: 5000,
  lockMs: 2000,
  runMs: 120000,
  queries: 300,
});
const uuid = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
export function requireCheck(value, code) {
  if (!value) throw Object.assign(new Error(code), { code });
}
export function connectionOptions(env, role = "troc_staging_runtime") {
  requireCheck(
    ["troc_staging_runtime", "troc_staging_observer"].includes(role),
    "role_blocked",
  );
  requireCheck(
    env.SUPABASE_URL === `https://${PROJECT}.supabase.co`,
    "target_blocked",
  );
  let url;
  try {
    url = new URL(env.DATABASE_URL);
  } catch {
    requireCheck(false, "configuration_missing");
  }
  const direct =
    url.hostname === `db.${PROJECT}.supabase.co` &&
    decodeURIComponent(url.username) === role &&
    (!url.port || url.port === "5432");
  const sessionPool =
    url.hostname === env.STAGING_POOLER_HOST &&
    url.hostname.endsWith(".pooler.supabase.com") &&
    url.port === "5432" &&
    decodeURIComponent(url.username) === `${role}.${PROJECT}`;
  requireCheck(
    ["postgres:", "postgresql:"].includes(url.protocol) &&
      url.pathname === "/postgres" &&
      !url.hash &&
      (direct || sessionPool),
    "target_blocked",
  );
  url.search = "";
  return {
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 5000,
    statement_timeout: BUDGET.statementMs,
    lock_timeout: BUDGET.lockMs,
    query_timeout: 6000,
    application_name: "troc-staging-concurrency",
  };
}
export function validateWindow(manifest, candidate, now = Date.now()) {
  requireCheck(
    manifest?.approvedBy === "A" &&
      manifest.project === PROJECT &&
      manifest.candidate === candidate &&
      /^[0-9a-f]{40}$/.test(candidate),
    "window_blocked",
  );
  const start = Date.parse(manifest.startsAt),
    end = Date.parse(manifest.endsAt);
  requireCheck(
    Number.isFinite(start) &&
      Number.isFinite(end) &&
      start <= now &&
      end >= now + BUDGET.runMs &&
      end - start <= 900000,
    "window_blocked",
  );
  requireCheck(
    uuid.test(manifest.runId) &&
      manifest.cleanupOwner === "A" &&
      manifest.preserveAudit === true &&
      manifest.allowClientDisconnect === true,
    "fixture_blocked",
  );
  requireCheck(
    Object.keys(BUDGET).every(
      (key) => manifest.budget?.[key] === BUDGET[key],
    ) && Object.keys(manifest.budget).length === Object.keys(BUDGET).length,
    "budget_blocked",
  );
  const names = [
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
  ];
  const ids = names.map((name) => manifest.ids?.[name]);
  requireCheck(
    ids.every((id) => typeof id === "string" && uuid.test(id)) &&
      new Set(ids).size === ids.length,
    "fixture_blocked",
  );
  return manifest;
}
const safeCodes = new Set([
  "target_blocked",
  "configuration_missing",
  "window_blocked",
  "fixture_blocked",
  "budget_blocked",
  "role_blocked",
  "tls_blocked",
  "identity_changed",
  "invariant_failed",
  "query_budget",
  "run_deadline",
  "cleanup_failed",
  "controlled_failure",
  "client_disconnected",
  "application_already_reviewed",
  "forbidden",
  "last_owner",
  "55P03",
  "57014",
  "40P01",
  "40001",
  "42501",
  "28P01",
  "53300",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
]);
export function errorClass(error) {
  return safeCodes.has(error?.code) ? error.code : "unexpected_failure";
}

export function barrier() {
  let arrivals = 0,
    release;
  const ready = new Promise((resolve) => {
    release = resolve;
  });
  return async () => {
    if (++arrivals === 2) release();
    let timer;
    try {
      await Promise.race([
        ready,
        new Promise((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                Object.assign(new Error("run_deadline"), {
                  code: "run_deadline",
                }),
              ),
            5000,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  };
}

export async function closeClient(client) {
  let timer;
  try {
    await Promise.race([
      client.end(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              Object.assign(new Error("cleanup_failed"), {
                code: "cleanup_failed",
              }),
            ),
          6000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// Preserve the first failure, but never mask a failed rollback/connection release.
export async function transaction(client, work, hook) {
  let begun = false;
  try {
    await client.query("BEGIN");
    begun = true;
    await client.query("SET LOCAL statement_timeout = '5s'");
    await client.query("SET LOCAL lock_timeout = '2s'");
    const sql = {
      query: async (text, params) => {
        if (hook) await hook(text, client);
        return client.query(text, params);
      },
    };
    const value = await work(sql);
    await client.query("COMMIT");
    begun = false;
    return value;
  } catch (error) {
    if (begun) {
      try {
        await client.query("ROLLBACK");
      } catch {
        if (error?.code !== "client_disconnected")
          throw Object.assign(new Error("cleanup_failed"), {
            code: "cleanup_failed",
          });
      }
    }
    throw error;
  }
}

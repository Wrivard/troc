import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const project = "wcpsyflzqaeorxaejaqh";
export function configuration(env) {
  const checks = {
    stagingProject: env.SUPABASE_URL === `https://${project}.supabase.co`,
    databaseConfigured: !!env.DATABASE_URL,
    publicAuthConfigured: !!env.SUPABASE_PUBLISHABLE_KEY,
    verifiedDatabaseTarget: false,
  };
  try {
    const url = new URL(env.DATABASE_URL);
    const direct = url.hostname === `db.${project}.supabase.co`;
    const pooler =
      url.hostname.endsWith(".pooler.supabase.com") &&
      url.hostname === env.STAGING_POOLER_HOST &&
      decodeURIComponent(url.username).endsWith(`.${project}`);
    checks.verifiedDatabaseTarget =
      ["postgres:", "postgresql:"].includes(url.protocol) &&
      url.pathname === "/postgres" &&
      (direct || pooler);
  } catch {
    /* Report presence/validity only, never the supplied value. */
  }
  return checks;
}

export function safeFailure(error) {
  const code = error?.code;
  if (["ETIMEDOUT", "ECONNREFUSED", "ENOTFOUND", "EHOSTUNREACH"].includes(code))
    return "connection_unavailable";
  if (code === "28P01" || code === "28000") return "authentication_failed";
  if (code === "42501") return "insufficient_privilege";
  if (code === "57014") return "query_timeout";
  return "database_check_failed";
}

export async function inspect(env, createClient) {
  const checks = configuration(env);
  const result = { status: "blocked", checks, database: null, failure: null };
  if (!Object.values(checks).every(Boolean)) return result;
  let client;
  try {
    // URL SSL parameters may override pg SSL options; strip them and enforce verification.
    const url = new URL(env.DATABASE_URL);
    for (const key of [...url.searchParams.keys()])
      url.searchParams.delete(key);
    client = createClient({
      connectionString: url.toString(),
      ssl: { rejectUnauthorized: true },
      connectionTimeoutMillis: 5000,
      statement_timeout: 5000,
      query_timeout: 6000,
      application_name: "troc-staging-readiness",
    });
    await client.connect();
    await client.query("BEGIN READ ONLY");
    await client.query("SET LOCAL lock_timeout = '2s'");
    const { rows } = await client.query(`SELECT
      current_user = 'troc_staging_runtime' AS dedicated_runtime,
      pg_has_role(current_user,'troc_backend','USAGE') AS backend_access,
      NOT (rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication) AS restricted_role,
      NOT has_schema_privilege(current_user,'troc','CREATE') AS no_schema_creation,
      (SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()) AS encrypted,
      (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='troc' AND c.relkind='r' AND NOT c.relrowsecurity) AS unprotected_tables,
      (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='troc' AND c.relkind='r') AS application_tables
      FROM pg_roles WHERE rolname=current_user`);
    const row = rows[0] ?? {};
    result.database = {
      dedicatedRuntime: row.dedicated_runtime === true,
      backendAccess: row.backend_access === true,
      restrictedRole: row.restricted_role === true,
      noSchemaCreation: row.no_schema_creation === true,
      encrypted: row.encrypted === true,
      allTablesProtected:
        row.unprotected_tables === 0 && row.application_tables >= 67,
    };
    result.status = Object.values(result.database).every(Boolean)
      ? "pass"
      : "fail";
  } catch (error) {
    result.status = "fail";
    result.failure = safeFailure(error);
  } finally {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* Preserve the redacted primary result. */
      }
      try {
        await client.end();
      } catch {
        result.status = "fail";
        result.failure ??= "connection_cleanup_failed";
      }
    }
  }
  return result;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const require = createRequire(
    new URL("../../lib/db/package.json", import.meta.url),
  );
  const { Client } = require("pg");
  void inspect(process.env, (options) => new Client(options)).then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exitCode =
      result.status === "pass" ? 0 : result.status === "blocked" ? 2 : 1;
  });
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { configuration, inspect } from "../scripts/staging-readiness/check.mjs";

const env = {
  SUPABASE_URL: "https://wcpsyflzqaeorxaejaqh.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "public-test-key",
  DATABASE_URL:
    "postgresql://troc_staging_runtime:SECRET@db.wcpsyflzqaeorxaejaqh.supabase.co/postgres?sslmode=disable",
};
test("staging diagnostics reject missing or wrong targets before connecting", async () => {
  for (const input of [
    {},
    { ...env, SUPABASE_URL: "https://other.supabase.co" },
    { ...env, DATABASE_URL: "postgres://user:SECRET@other.example/postgres" },
  ]) {
    const result = await inspect(input, () => {
      throw new Error("must not connect");
    });
    assert.equal(result.status, "blocked");
    assert.ok(!JSON.stringify(result).includes("SECRET"));
  }
  assert.equal(
    configuration({
      ...env,
      DATABASE_URL:
        "postgres://runtime.wcpsyflzqaeorxaejaqh:SECRET@verified.pooler.supabase.com/postgres",
      STAGING_POOLER_HOST: "verified.pooler.supabase.com",
    }).verifiedDatabaseTarget,
    true,
  );
});
test("staging diagnostics enforce TLS, read-only scope, role checks and cleanup", async () => {
  const calls: string[] = [];
  const result = await inspect(
    env,
    (options: {
      connectionString: string;
      ssl: { rejectUnauthorized: boolean };
    }) => {
      assert.equal(options.ssl.rejectUnauthorized, true);
      assert.ok(!options.connectionString.includes("sslmode"));
      return {
        connect: async () => {
          calls.push("connect");
        },
        query: async (sql: string) => {
          calls.push(sql);
          return {
            rows: [
              {
                dedicated_runtime: true,
                backend_access: true,
                restricted_role: true,
                no_schema_creation: true,
                no_effective_ownership: true,
                no_dangerous_membership: true,
                encrypted: true,
                unprotected_tables: 0,
                application_tables: 67,
              },
            ],
          };
        },
        end: async () => {
          calls.push("end");
        },
      };
    },
  );
  assert.equal(result.status, "pass");
  assert.equal(calls[1], "BEGIN READ ONLY");
  assert.deepEqual(calls.slice(-2), ["ROLLBACK", "end"]);
  assert.ok(!JSON.stringify(result).includes("SECRET"));
});
test("staging diagnostics suppress credential-bearing errors and fail unsafe roles", async () => {
  for (const fail of [true, false]) {
    let ended = false;
    const result = await inspect(env, () => ({
      connect: async () => {
        if (fail)
          throw Object.assign(new Error("SECRET personal@example.test"), {
            code: "28P01",
          });
      },
      query: async () => ({
        rows: [
          {
            dedicated_runtime: false,
            backend_access: true,
            restricted_role: false,
            no_schema_creation: false,
            encrypted: true,
            unprotected_tables: 0,
            application_tables: 67,
          },
        ],
      }),
      end: async () => {
        ended = true;
      },
    }));
    assert.equal(result.status, "fail");
    assert.equal(ended, true);
    assert.ok(!JSON.stringify(result).includes("SECRET"));
    assert.ok(!JSON.stringify(result).includes("personal@"));
    if (fail) assert.equal(result.failure, "authentication_failed");
  }
});

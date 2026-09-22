import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { inspect } from "../scripts/staging-readiness/check.mjs";

test("readiness rejects direct, inherited and reachable owners and elevated memberships", async () => {
  const db = new PGlite();
  const env = {
    SUPABASE_URL: "https://wcpsyflzqaeorxaejaqh.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "fixture",
    DATABASE_URL:
      "postgres://troc_staging_runtime:fixture@db.wcpsyflzqaeorxaejaqh.supabase.co/postgres",
  };
  const run = () =>
    inspect(env, () => ({
      connect: async () => {},
      query: (sql: string) =>
        db.query(
          sql.replace(
            "(SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid())",
            "true",
          ),
        ),
      end: async () => {},
    }));
  try {
    await db.exec(`CREATE ROLE troc_backend; CREATE ROLE troc_staging_runtime; CREATE ROLE fixture_owner; CREATE ROLE fixture_middle; CREATE ROLE fixture_privileged BYPASSRLS;
      GRANT troc_backend TO troc_staging_runtime; CREATE SCHEMA troc; GRANT USAGE ON SCHEMA troc TO troc_backend;
      DO $$ BEGIN FOR i IN 1..67 LOOP EXECUTE format('CREATE TABLE troc.t%s(id int)',i); EXECUTE format('ALTER TABLE troc.t%s ENABLE ROW LEVEL SECURITY',i); END LOOP; END $$;
      INSERT INTO troc.t1 VALUES(1); SET ROLE troc_staging_runtime;`);
    assert.equal((await run()).status, "pass");
    await db.exec(
      "RESET ROLE; ALTER TABLE troc.t1 OWNER TO troc_staging_runtime; SET ROLE troc_staging_runtime;",
    );
    assert.equal(
      (await db.query("SELECT * FROM troc.t1")).rows.length,
      1,
      "Owner bypass is real despite RLS",
    );
    assert.equal((await run()).status, "fail", "Direct table owner must fail");
    await db.exec(
      "RESET ROLE; ALTER TABLE troc.t1 OWNER TO fixture_owner; GRANT fixture_owner TO fixture_middle; GRANT fixture_middle TO troc_staging_runtime; SET ROLE troc_staging_runtime;",
    );
    assert.equal(
      (await run()).database?.noEffectiveOwnership,
      false,
      "Transitive inherited owner must fail",
    );
    await db.exec(
      "RESET ROLE; ALTER ROLE troc_staging_runtime NOINHERIT; SET ROLE troc_staging_runtime;",
    );
    assert.equal(
      (await run()).database?.noEffectiveOwnership,
      false,
      "SET-reachable owner must fail even without inheritance",
    );
    await db.exec(
      "RESET ROLE; REVOKE fixture_middle FROM troc_staging_runtime; ALTER ROLE troc_staging_runtime INHERIT; GRANT fixture_privileged TO troc_staging_runtime; SET ROLE troc_staging_runtime;",
    );
    assert.equal(
      (await run()).database?.noDangerousMembership,
      false,
      "Reachable BYPASSRLS role must fail",
    );
    await db.exec(
      "RESET ROLE; REVOKE fixture_privileged FROM troc_staging_runtime; GRANT pg_read_all_data TO troc_staging_runtime; SET ROLE troc_staging_runtime;",
    );
    assert.equal(
      (await run()).database?.noDangerousMembership,
      false,
      "Broad predefined data role must fail",
    );
    await db.exec(
      "RESET ROLE; REVOKE pg_read_all_data FROM troc_staging_runtime; SET ROLE troc_staging_runtime;",
    );
    assert.equal(
      (await run()).status,
      "pass",
      "Removing dangerous memberships restores the valid baseline",
    );
  } finally {
    await db.close();
  }
});

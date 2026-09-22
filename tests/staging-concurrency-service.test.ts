import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { SellerPlatformService } from "../artifacts/api-server/src/modules/seller-platform/service";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
import { fixtures, identity } from "../scripts/staging-concurrency/run.mjs";
import { transaction } from "../scripts/staging-concurrency/guards.mjs";

test("local service adapter proves fixture queries, atomic injected rollback and retry; not PostgreSQL concurrency", async () => {
  const db = new PGlite({ extensions: { pg_trgm } });
  try {
    const dir = new URL("../lib/db/migrations/", import.meta.url);
    for (const file of (await readdir(dir))
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await db.exec(await readFile(new URL(file, dir), "utf8"));
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
    const ids = Object.fromEntries(names.map((n) => [n, randomUUID()]));
    const runId = randomUUID();
    for (const name of names.slice(0, 7))
      await db.query("INSERT INTO troc.users(id,email) VALUES($1,$2)", [
        ids[name],
        `troc-d-${runId}-${name.toLowerCase()}@example.invalid`,
      ]);
    await db.query(
      "INSERT INTO troc.user_roles(user_id,role) VALUES($1,'admin')",
      [ids.admin],
    );
    await db.query(
      "INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status) VALUES($1,$2,'Synthetic','individual','active')",
      [ids.seller, `troc-d-${runId}`],
    );
    for (const name of ["ownerA", "ownerB", "target"])
      await db.query(
        "INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES($1,$2,$3)",
        [ids.seller, ids[name], name === "target" ? "inventory" : "owner"],
      );
    await db.query(
      "INSERT INTO troc.seller_applications(id,applicant_id,contact_name,country,province,seller_type,adult_confirmed) VALUES($1,$2,$3,'CA','QC','individual',true)",
      [ids.application, ids.applicant, `troc-d-${runId}`],
    );
    await db.query(
      "INSERT INTO troc.audit_events(id,actor_id,action,entity_type,entity_id) VALUES($1,$2,'staging.fixture.created','staging_run',$3)",
      [ids.auditProbe, ids.admin, runId],
    );
    await db.exec(`CREATE ROLE troc_staging_runtime; GRANT troc_backend TO troc_staging_runtime;
      CREATE ROLE troc_staging_observer; GRANT USAGE ON SCHEMA troc TO troc_staging_observer;
      GRANT SELECT ON troc.audit_events TO troc_staging_observer;
      CREATE POLICY d_fixture_audit_read ON troc.audit_events FOR SELECT TO troc_staging_observer USING (entity_id IN ('${runId}','${ids.application}','${ids.seller}'));`);
    // Local serial role switching only. Remote runner uses independent restricted logins.
    const observer = {
      query: async (sql: string, params?: unknown[]) => {
        await db.exec("RESET ROLE; SET ROLE troc_staging_observer");
        try {
          return await db.query(sql, params);
        } finally {
          await db.exec("RESET ROLE; SET ROLE troc_staging_runtime");
        }
      },
    };
    await db.exec("SET ROLE troc_staging_runtime");
    // PGlite uses template1 and lacks a TLS login: substitute transport/session/database fields for SQL-shape coverage.
    const transport = (sql: string) =>
      sql
        .replace("session_user AS login", "current_user AS login")
        .replace("pg_backend_pid() AS pid", "1 AS pid")
        .replace("current_database() AS database", "'postgres' AS database")
        .replace(
          "(SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid())",
          "true",
        );
    await identity({ query: (sql: string) => db.query(transport(sql)) });
    await identity(
      { query: (sql: string) => observer.query(transport(sql)) },
      "troc_staging_observer",
    );
    await assert.rejects(() => db.query("SELECT id FROM troc.audit_events"), {
      code: "42501",
    });
    await fixtures(db, { ids, runId }, observer);
    const principal = {
      userId: ids.ownerA,
      roles: ["admin"] as const,
      memberships: [],
    };
    const snap = async () =>
      JSON.stringify({
        members: (
          await db.query(
            "SELECT user_id,role FROM troc.seller_members WHERE seller_id=$1 ORDER BY user_id",
            [ids.seller],
          )
        ).rows,
        audits: (
          await observer.query(
            "SELECT id FROM troc.audit_events WHERE entity_id=$1",
            [ids.seller],
          )
        ).rows,
      });
    const before = await snap();
    const injected = new SellerPlatformService(db as Sql, {
      transaction: (work) =>
        transaction(db, work, async (sql: string) => {
          if (sql.startsWith("INSERT INTO troc.audit_events"))
            throw Object.assign(new Error("synthetic"), {
              code: "controlled_failure",
            });
        }),
    });
    await assert.rejects(
      () =>
        injected.member({ ...principal, roles: ["admin"] }, ids.seller, {
          userId: ids.target,
          role: "manager",
        }),
      { code: "controlled_failure" },
    );
    assert.equal(await snap(), before);
    const service = new SellerPlatformService(db as Sql, {
      transaction: (work) => transaction(db, work),
    });
    await service.member({ ...principal, roles: ["admin"] }, ids.seller, {
      userId: ids.target,
      role: "manager",
    });
    assert.notEqual(await snap(), before);
    const reviewed = await service.review(
      { userId: ids.admin, roles: ["admin"], memberships: [] },
      ids.application,
      { decision: "approved", note: "Synthetic" },
    );
    assert.ok(reviewed.sellerId);
    await assert.rejects(
      () =>
        service.review(
          { userId: ids.staleAdmin, roles: ["admin"], memberships: [] },
          ids.application,
          { decision: "approved", note: "Synthetic" },
        ),
      { code: "forbidden" },
    );
  } finally {
    await db.close();
  }
});

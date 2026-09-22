import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { PrelaunchService } from "../artifacts/api-server/src/modules/prelaunch/service";
import {
  signup,
  consentVersion,
} from "../artifacts/api-server/src/modules/prelaunch/validation";
import { prelaunchRouter } from "../artifacts/api-server/src/routes/prelaunch";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
import type { Principal } from "../artifacts/api-server/src/modules/auth/permissions";
import express from "../artifacts/api-server/node_modules/express/index.js";

const payload = () => ({
  email: "lead@example.test",
  locale: "fr",
  consent: true,
  consentVersion,
  country: "CA",
  province: "QC",
  games: ["pokemon"],
  channels: ["ebay"],
  frequency: "monthly",
  withdrawal: randomBytes(32).toString("base64url"),
});
test("prelaunch validates consent, Canadian region, enums, lengths, email and honeypot", () => {
  for (const patch of [
    { consent: false },
    { consentVersion: "old" },
    { email: "bad" },
    { country: "US" },
    { province: "XX" },
    { games: ["fake"] },
    { website: "spam" },
    { withdrawal: "guess" },
    { wishlist: "a".repeat(1001) },
  ])
    assert.throws(() => signup({ ...payload(), ...patch }, "collector"));
  assert.equal(
    signup({ ...payload(), email: " Lead@Example.Test " }, "collector").email,
    "lead@example.test",
  );
  assert.throws(() => signup(payload(), "seller"));
});
test("prelaunch migration on 0008, real lead lifecycle, private admin, attribution and event provenance", async (t) => {
  const db = new PGlite({ extensions: { pg_trgm } });
  const dir = new URL("../lib/db/migrations/", import.meta.url);
  try {
    for (const file of (await readdir(dir))
      .filter((f) => f.endsWith(".sql") && !f.startsWith("0009"))
      .sort())
      await db.exec(await readFile(new URL(file, dir), "utf8"));
    const actor = randomUUID();
    await db.query(
      `INSERT INTO troc.users(id,email) VALUES($1,'admin@example.test')`,
      [actor],
    );
    const p: Principal = { userId: actor, roles: ["admin"], memberships: [] };
    const store = {
      transaction: <T>(work: (sql: Sql) => Promise<T>) =>
        db.transaction(async (tx) => {
          await tx.exec("SET LOCAL ROLE troc_backend");
          return work(tx as Sql);
        }),
    };
    // Every service query runs with backend privileges, not the migration owner.
    const sql: Sql = {
      query: async (query, params) =>
        store.transaction((tx) => tx.query(query, params)),
    };
    const service = new PrelaunchService(
      sql,
      store,
      "local-test-key-with-at-least-32-characters",
    );
    const session = async (extra = {}) =>
      service.session({
        kind: "collector",
        source: "social",
        analyticsConsent: true,
        ...extra,
      });
    let token = "",
      withdrawal = "",
      leadId = "";
    await t.test(
      "public and non-admin principals cannot inspect or change leads",
      async () => {
        for (const principal of [
          null,
          { ...p, roles: [] },
          { ...p, roles: ["support"] as Principal["roles"] },
        ]) {
          await assert.rejects(service.list(principal, { kind: "collector" }));
          await assert.rejects(service.metrics(principal));
          await assert.rejects(service.referral(principal));
          await assert.rejects(
            service.update(principal, "collector", randomUUID(), {}),
          );
        }
      },
    );
    await t.test(
      "capture and duplicates preserve consent, details, acquisition and withdrawal secret",
      async () => {
        const ref = await service.referral(p);
        ({ token } = await session({ referral: ref.code }));
        const data = payload();
        withdrawal = data.withdrawal;
        await service.capture({
          ...data,
          token,
          source: "partner",
          referral: "tampered",
          cohort: "public",
          lead_status: "contacted",
        });
        const second = await session({ source: "event" });
        await Promise.all([
          service.capture({
            ...data,
            token: second.token,
            email: "LEAD@example.test",
            province: "ON",
          }),
          service.capture({
            ...data,
            token: second.token,
            withdrawal: randomBytes(32).toString("base64url"),
          }),
        ]);
        const rows = await service.list(p, { kind: "collector" });
        assert.equal(rows.length, 1);
        const row = rows[0] as {
          id: string;
          details: { province: string };
          acquisition: { source: string; referral: string };
          cohort: string;
          revision: number;
        };
        leadId = row.id;
        assert.equal(row.details.province, "QC");
        assert.equal(row.acquisition.source, "social");
        assert.equal(row.acquisition.referral, ref.code);
        assert.equal(row.cohort, "unassigned");
      },
    );
    await t.test(
      "invalid session signatures and client completion claims are rejected; observations deduplicate",
      async () => {
        await assert.rejects(
          service.capture({ ...payload(), token: token.slice(0, -2) + "zz" }),
        );
        await assert.rejects(service.observe({ token, name: "completion" }));
        for (let i = 0; i < 3; i++)
          await service.observe({ token, name: "form_start" });
        const result = await service.metrics(p);
        assert.equal(result.events.length, 3);
        for (const row of result.events as { count: number }[])
          assert.equal(row.count, 1);
        assert.equal(
          result.notInstrumented.includes("seller_activation"),
          true,
        );
        const quiet = await session({
          analyticsConsent: false,
          referral: "unknown-code",
        });
        await service.observe({ token: quiet.token, name: "cta" });
        await service.capture({
          ...payload(),
          token: quiet.token,
          email: "quiet@example.test",
        });
        assert.equal((await service.metrics(p)).events.length, 3);
      },
    );
    await t.test(
      "admin filters and optimistic updates are audited; cohorts do not activate accounts",
      async () => {
        assert.equal(
          (
            await service.list(p, {
              kind: "collector",
              province: "QC",
              games: "pokemon",
            })
          ).length,
          2,
        );
        assert.equal(
          (await service.list(p, { kind: "collector", province: "ON" })).length,
          0,
        );
        await service.update(p, "collector", leadId, {
          cohort: "collector_closed_beta",
          status: "reviewing",
          revision: 1,
        });
        await assert.rejects(
          service.update(p, "collector", leadId, {
            cohort: "public",
            status: "contacted",
            revision: 1,
          }),
          /lead_conflict/,
        );
        assert.equal(
          (await db.query("SELECT * FROM troc.seller_accounts")).rows.length,
          0,
        );
        assert.equal(
          (
            await db.query(
              `SELECT * FROM troc.audit_events WHERE action='prelaunch.review'`,
            )
          ).rows.length,
          1,
        );
      },
    );
    await t.test(
      "withdrawal is capability-protected, idempotent, and cannot be reversed through signup",
      async () => {
        await service.withdraw({
          kind: "collector",
          withdrawal: randomBytes(32).toString("base64url"),
        });
        await service.withdraw({ kind: "collector", withdrawal });
        await service.withdraw({ kind: "collector", withdrawal });
        await service.capture({ ...payload(), token, withdrawal });
        const row = (await service.list(p, { kind: "collector" })).find(
          (r) => (r as { id: string }).id === leadId,
        ) as { unsubscribed_at: string; revision: number };
        assert.ok(row.unsubscribed_at);
        await assert.rejects(
          service.update(p, "collector", leadId, {
            cohort: "public",
            status: "contacted",
            revision: row.revision,
          }),
        );
        assert.equal(
          (
            await db.query(
              `SELECT * FROM troc.audit_events WHERE action='prelaunch.consent_withdrawn'`,
            )
          ).rows.length,
          1,
        );
      },
    );
    await t.test(
      "seller attributes filter independently of seller applications",
      async () => {
        const s = await session({ kind: "seller" });
        await service.capture({
          ...payload(),
          token: s.token,
          email: "seller-owner@example.test",
          adult: true,
          contact: "Store",
          software: ["sortswift"],
          inventory: "50000_plus",
          sellerType: "hobby_shop",
          experience: "3_plus_years",
        });
        assert.equal(
          (
            await service.list(p, {
              kind: "seller",
              software: "sortswift",
              inventory: "50000_plus",
              experience: "3_plus_years",
            })
          ).length,
          1,
        );
        assert.equal(
          (await db.query("SELECT * FROM troc.seller_applications")).rows
            .length,
          0,
        );
      },
    );
    await t.test(
      "referral owners are private, consented leads; self-referrals and revoked codes do not attribute",
      async () => {
        const owner = (await service.list(p, { kind: "seller" }))[0] as {
          id: string;
        };
        const ref = await service.referral(p, {
          kind: "seller",
          leadId: owner.id,
        });
        const self = await session({ referral: ref.code });
        // Seller and collector lists are distinct, but normalized email still prevents self-attribution.
        await service.capture({
          ...payload(),
          email: " SELLER-OWNER@example.test ",
          token: self.token,
        });
        const selfRow = (await service.list(p, { kind: "collector" })).find(
          (r) => (r as { email: string }).email === "seller-owner@example.test",
        ) as { acquisition: { referral: string | null } };
        assert.equal(selfRow.acquisition.referral, null);
        const ownerRow = (
          await db.query<{ seller_lead_id: string }>(
            "SELECT seller_lead_id FROM troc.prelaunch_referrals WHERE code=$1",
            [ref.code],
          )
        ).rows[0];
        assert.equal(ownerRow.seller_lead_id, owner.id);
        const fresh = await session({ referral: ref.code });
        await db.query(
          "UPDATE troc.prelaunch_referrals SET active=false WHERE code=$1",
          [ref.code],
        );
        await service.capture({
          ...payload(),
          email: "revoked@example.test",
          token: fresh.token,
        });
        const row = (await service.list(p, { kind: "collector" })).find(
          (r) => (r as { email: string }).email === "revoked@example.test",
        ) as { acquisition: { referral: string | null } };
        assert.equal(row.acquisition.referral, null);
        await assert.rejects(
          service.referral(p, { kind: "collector", leadId }),
          /lead_unavailable/,
        );
        await assert.rejects(
          service.referral(p, { kind: "seller", leadId: randomUUID() }),
          /lead_unavailable/,
        );
      },
    );
    await t.test(
      "consent toggles retain journey identity; no unconsented or retroactive events",
      async () => {
        const j = await session({ kind: "landing", analyticsConsent: false });
        await service.observe({ token: j.token, name: "landing_visit" });
        assert.equal(
          (
            await db.query(
              "SELECT * FROM troc.prelaunch_events WHERE session_id=$1",
              [j.token.split(".")[0]],
            )
          ).rows.length,
          0,
        );
        await service.sessionPreferences({
          token: j.token,
          analyticsConsent: true,
        });
        await service.observe({ token: j.token, name: "landing_visit" });
        await service.sessionPreferences({
          token: j.token,
          kind: "collector",
          analyticsConsent: true,
        });
        await service.observe({ token: j.token, name: "cta" });
        await service.observe({ token: j.token, name: "form_start" });
        for (let i = 0; i < 2; i++) {
          await service.sessionPreferences({
            token: j.token,
            analyticsConsent: false,
          });
          await service.observe({ token: j.token, name: "form_start" });
          await service.sessionPreferences({
            token: j.token,
            analyticsConsent: true,
          });
          await service.observe({ token: j.token, name: "form_start" });
        }
        assert.equal(
          (
            await db.query(
              "SELECT * FROM troc.prelaunch_events WHERE session_id=$1",
              [j.token.split(".")[0]],
            )
          ).rows.length,
          3,
        );
        await assert.rejects(
          service.sessionPreferences({
            token: j.token,
            kind: "seller",
            analyticsConsent: true,
          }),
          /session_conflict/,
        );
        const landing = await session({ kind: "landing" });
        await assert.rejects(
          service.capture({ ...payload(), token: landing.token }),
        );
      },
    );
    await t.test(
      "expired sessions and durable request throttles fail closed",
      async () => {
        const expired = await session();
        await db.query(
          `UPDATE troc.prelaunch_sessions SET expires_at=now()-interval '1 second' WHERE id=$1`,
          [expired.token.split(".")[0]],
        );
        await assert.rejects(
          service.capture({ ...payload(), token: expired.token }),
          /session_expired/,
        );
        for (let i = 0; i < 40; i++) await service.throttle("test-ip");
        await assert.rejects(service.throttle("test-ip"), /rate_limited/);
      },
    );
    await t.test(
      "unprivileged roles cannot read any lead or analytics table",
      async () => {
        await db.exec(
          "CREATE ROLE prelaunch_browser NOLOGIN; GRANT USAGE ON SCHEMA troc TO prelaunch_browser; SET ROLE prelaunch_browser",
        );
        for (const table of [
          "buyer_waitlist",
          "founding_seller_leads",
          "prelaunch_sessions",
          "prelaunch_events",
          "prelaunch_referrals",
        ])
          await assert.rejects(db.query("SELECT * FROM troc." + table));
        await db.exec("RESET ROLE");
      },
    );
    await t.test(
      "unmounted HTTP router gates config, same-origin writes and verified admin",
      async () => {
        const app = express();
        const config = {
          enabled: true,
          databaseReady: true,
          appOrigin: "http://localhost:5312",
          signingKey: "local-test-key-with-at-least-32-characters",
        };
        app.use(
          "/off",
          prelaunchRouter(sql, store, async () => p, {
            ...config,
            enabled: false,
          }),
        );
        app.use(
          "/api/prelaunch",
          prelaunchRouter(
            sql,
            store,
            async () => ({ ...p, roles: [] }),
            config,
          ),
        );
        app.use(
          "/opaque",
          prelaunchRouter(sql, store, async () => p, {
            ...config,
            appOrigin: "file:///tmp/prelaunch",
          }),
        );
        const server = app.listen(0, "127.0.0.1");
        await new Promise<void>((resolve) => server.once("listening", resolve));
        const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
        try {
          assert.equal(
            (await fetch(base + "/off/admin/leads?kind=collector")).status,
            503,
          );
          assert.equal(
            (await fetch(base + "/api/prelaunch/admin/leads?kind=collector"))
              .status,
            403,
          );
          assert.equal(
            (
              await fetch(base + "/api/prelaunch/sessions", {
                method: "POST",
                headers: {
                  Origin: "https://evil.test",
                  "Content-Type": "application/json",
                },
                body: "{}",
              })
            ).status,
            403,
          );
          const response = await fetch(base + "/api/prelaunch/sessions", {
            method: "POST",
            headers: {
              Origin: config.appOrigin,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              kind: "collector",
              analyticsConsent: false,
            }),
          });
          assert.equal(response.status, 201);
          assert.equal(response.headers.get("cache-control"), "no-store");
          const post = (
            path: string,
            body: string,
            origin = config.appOrigin,
          ) =>
            fetch(base + path, {
              method: "POST",
              headers: { Origin: origin, "Content-Type": "application/json" },
              body,
            });
          assert.equal(
            (await post("/opaque/sessions", "{}", "null")).status,
            503,
          );
          for (const [body, status] of [
            ["{", 400],
            ["null", 400],
            [JSON.stringify({ x: "a".repeat(13000) }), 413],
          ] as const) {
            const r = await post("/api/prelaunch/sessions", body);
            assert.equal(r.status, status);
          }
          const fresh = payload(),
            freshSession = await session();
          await service.capture({
            ...fresh,
            email: "quota-withdraw@example.test",
            token: freshSession.token,
          });
          for (let i = 0; i < 40; i++) {
            try {
              await service.throttle("127.0.0.1");
            } catch {
              break;
            }
          }
          assert.equal(
            (
              await post(
                "/api/prelaunch/sessions",
                JSON.stringify({ kind: "collector", analyticsConsent: false }),
              )
            ).status,
            429,
          );
          assert.equal(
            (
              await post(
                "/api/prelaunch/withdraw",
                JSON.stringify({
                  kind: "collector",
                  withdrawal: fresh.withdrawal,
                }),
              )
            ).status,
            202,
          );
          assert.ok(
            (
              await db.query<{ unsubscribed_at: string }>(
                "SELECT unsubscribed_at FROM troc.buyer_waitlist WHERE email=$1",
                ["quota-withdraw@example.test"],
              )
            ).rows[0].unsubscribed_at,
          );
        } finally {
          await new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          );
        }
      },
    );
  } finally {
    await db.close();
  }
});

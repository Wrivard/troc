import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { SellerPlatformService } from "../artifacts/api-server/src/modules/seller-platform/service";
import { application } from "../artifacts/api-server/src/modules/seller-platform/domain";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
import type { Principal } from "../artifacts/api-server/src/modules/auth/permissions";
const input = {
  contactName: "Seller",
  country: "CA",
  province: "QC",
  sellerType: "individual",
  adultConfirmed: true,
  displayName: "My store",
  games: ["Pokemon"],
  inventorySize: 200,
};
test("application reuses validation, bounds and rejects unsafe URLs", () => {
  assert.equal(application(input).profile.inventorySize, 200);
  assert.equal(
    application({ ...input, displayName: undefined }).profile.displayName,
    "Seller",
  );
  for (const bad of [
    { adultConfirmed: false },
    { country: "US" },
    { inventorySize: -1 },
    { channels: ["javascript:alert(1)"] },
    { games: Array(16).fill("game") },
  ])
    assert.throws(() => application({ ...input, ...bad }));
});
test("seller platform database authorization and transitions", async (t) => {
  const db = new PGlite({ extensions: { pg_trgm } });
  try {
    const dir = new URL("../lib/db/migrations/", import.meta.url);
    for (const file of (await readdir(dir))
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await db.exec(await readFile(new URL(file, dir), "utf8"));
    const ids = Array.from({ length: 6 }, () => randomUUID()),
      [owner, admin, staff, other, support, inactive] = ids;
    for (const [i, id] of ids.entries())
      await db.query("INSERT INTO troc.users(id,email) VALUES($1,$2)", [
        id,
        `user${i}@example.test`,
      ]);
    await db.query(
      "INSERT INTO troc.user_roles(user_id,role) VALUES($1,'admin'),($2,'support')",
      [admin, support],
    );
    await db.query("UPDATE troc.users SET status='suspended' WHERE id=$1", [
      inactive,
    ]);
    const p = (id: string): Principal => ({
      userId: id,
      roles: ["admin"],
      memberships: [],
    }); // forged/stale principal claims never authorize writes
    const store = {
      transaction: <T>(work: (sql: Sql) => Promise<T>) =>
        db.transaction(async (tx) => {
          await tx.exec("SET LOCAL ROLE troc_backend");
          return work(tx as Sql);
        }),
    };
    const service = new SellerPlatformService(db as Sql, store);
    const app = await service.submit(p(owner), input);
    await t.test("duplicates and applicant isolation", async () => {
      await assert.rejects(
        () => service.submit(p(owner), input),
        /application_exists/,
      );
      assert.equal((await service.applications(p(other))).length, 0);
      await assert.rejects(
        () => service.applications(p(support), true),
        /forbidden/,
      );
      await assert.rejects(
        () => service.submit(p(inactive), input),
        /unauthorized/,
      );
    });
    await t.test(
      "manual approval requires real admin and is atomic/idempotent conflict",
      async () => {
        for (const id of [owner, staff, support])
          await assert.rejects(
            () =>
              service.review(p(id), String(app.id), {
                decision: "approved",
                note: "reviewed",
              }),
            /forbidden/,
          );
      },
    );
    const approved = await service.review(p(admin), String(app.id), {
        decision: "approved",
        note: "Reviewed application",
      }),
      seller = approved.sellerId!;
    await t.test(
      "approval creates free/new unverified account, no rewards; retries cannot duplicate",
      async () => {
        await assert.rejects(
          () =>
            service.review(p(admin), String(app.id), {
              decision: "approved",
              note: "again",
            }),
          /already_reviewed/,
        );
        const row = (
          await db.query("SELECT * FROM troc.seller_accounts WHERE id=$1", [
            seller,
          ])
        ).rows[0];
        assert.equal(row.plan_id, "free");
        assert.equal(row.level_id, "new");
        assert.equal(row.pro_lifetime, false);
        assert.equal(row.founding_number, null);
        assert.equal(
          (
            await db.query(
              "SELECT * FROM troc.seller_badge_assignments WHERE seller_id=$1",
              [seller],
            )
          ).rows.length,
          0,
        );
        assert.equal(
          (
            await db.query(
              "SELECT kyc_status FROM troc.seller_verification_status WHERE seller_id=$1",
              [seller],
            )
          ).rows[0].kyc_status,
          "not_started",
        );
        await assert.rejects(
          () => service.submit(p(owner), input),
          /application_exists/,
        );
      },
    );
    await t.test(
      "owner-only team administration and last-owner protection",
      async () => {
        await assert.rejects(
          () => service.member(p(owner), seller, { userId: owner, role: null }),
          /last_owner/,
        );
        await service.member(p(owner), seller, {
          userId: staff,
          role: "manager",
        });
        await assert.rejects(
          () =>
            service.member(p(staff), seller, { userId: staff, role: "owner" }),
          /forbidden/,
        );
        await assert.rejects(
          () =>
            service.member(p(admin), seller, { userId: admin, role: "owner" }),
          /forbidden/,
        );
        await assert.rejects(
          () =>
            service.member(p(owner), seller, {
              userId: inactive,
              role: "owner",
            }),
          /member_unavailable/,
        );
        await assert.rejects(
          () =>
            service.member(p(owner), seller, { userId: staff, role: "admin" }),
          /invalid_role/,
        );
        await service.member(p(owner), seller, {
          userId: other,
          role: "owner",
        });
        await service.member(p(other), seller, {
          userId: owner,
          role: "inventory",
        });
        await assert.rejects(
          () =>
            service.member(p(owner), seller, { userId: owner, role: "owner" }),
          /forbidden/,
        );
        await assert.rejects(
          () =>
            service.member(p(other), seller, {
              userId: other,
              role: "manager",
            }),
          /last_owner/,
        );
        await service.member(p(other), seller, { userId: staff, role: null });
        await assert.rejects(
          () => service.dashboard(p(staff), seller),
          /forbidden/,
        );
        await assert.rejects(
          () => service.dashboard(p(other), randomUUID()),
          /forbidden/,
        );
      },
    );
    await t.test("empty dashboard is truthful and scoped", async () => {
      const result = await service.dashboard(p(other), seller);
      assert.equal(result.sales.completed_orders, 0);
      assert.equal(result.sales.merchandise_cents, "0");
      assert.equal(result.inventory.active_listings, 0);
      assert.equal(result.analyticsAvailable, false);
    });
    await t.test(
      "sales totals exclude simulation, demo, refunds and other sellers",
      async () => {
        const demo = String(
          (
            await db.query(
              "SELECT id FROM troc.demo_batches WHERE seed_key='commerce-simulation'",
            )
          ).rows[0].id,
        );
        const secondSeller = randomUUID();
        await db.query(
          "INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status) VALUES($1,$2,'Other','individual','active')",
          [secondSeller, "other-" + secondSeller],
        );
        for (const [payment, batch, refunded, sellerId, state] of [
          ["provider_test_1", null, 0, seller, "completed"],
          ["sim_test", null, 0, seller, "completed"],
          ["provider_test_2", demo, 0, seller, "completed"],
          ["provider_test_3", null, 100, seller, "completed"],
          ["provider_test_4", null, 0, secondSeller, "completed"],
          ["provider_test_5", null, 0, seller, "cancelled"],
        ]) {
          const order = randomUUID();
          await db.query(
            "INSERT INTO troc.marketplace_orders(id,buyer_id,status,total_cents,idempotency_key,payment_id,demo_batch_id) VALUES($1::uuid,$2,'completed',1000,$1::text,$3,$4)",
            [order, staff, payment, batch],
          );
          await db.query(
            "INSERT INTO troc.seller_orders(marketplace_order_id,seller_id,merchandise_cents,discount_cents,shipping_cents,status,refunded_cents) VALUES($1,$2,1000,100,200,$3,$4)",
            [order, sellerId, state, refunded],
          );
        }
        const result = await service.dashboard(p(other), seller);
        assert.equal(result.sales.completed_orders, 1);
        assert.equal(result.sales.merchandise_cents, "900");
      },
    );
    await t.test(
      "review audit includes transitions and rejects self-review",
      async () => {
        const self = await service.submit(p(admin), input);
        await assert.rejects(
          () =>
            service.review(p(admin), String(self.id), {
              decision: "approved",
              note: "self",
            }),
          /self_approval/,
        );
        const second = await service.submit(p(staff), input);
        await service.review(p(admin), String(second.id), {
          decision: "rejected",
          note: "Missing information",
        });
        await service.submit(p(staff), input);
        const audits = (
          await db.query(
            "SELECT metadata FROM troc.audit_events WHERE entity_id=$1 AND action='seller.application.approved'",
            [app.id],
          )
        ).rows;
        assert.equal(audits.length, 1);
        assert.equal(
          (audits[0].metadata as { previousStatus: string }).previousStatus,
          "submitted",
        );
        await assert.rejects(
          () =>
            db.query("DELETE FROM troc.audit_events WHERE entity_id=$1", [
              app.id,
            ]),
          /Append-only/,
        );
      },
    );
  } finally {
    await db.close();
  }
});

import { sellerOrderSummary } from "../artifacts/api-server/src/modules/seller-platform/order-summary";
import { createRequire } from "node:module";
import type { Request, Response, NextFunction } from "express";
import { sellerPlatformRouter } from "../artifacts/api-server/src/routes/seller-platform";
import { DomainError } from "../artifacts/api-server/src/modules/shared/domain";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import {
  sellerOrderList,
  orderListInput,
} from "../artifacts/api-server/src/modules/seller-platform/order-list";
import { SellerPlatformService } from "../artifacts/api-server/src/modules/seller-platform/service";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
import type {
  Principal,
  SellerRole,
} from "../artifacts/api-server/src/modules/auth/permissions";

test("order cursor traverses >200 rows with ties, filters and store authorization", async () => {
  const db = new PGlite({ extensions: { pg_trgm } });
  try {
    const dir = new URL("../lib/db/migrations/", import.meta.url);
    for (const f of (await readdir(dir))
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await db.exec(await readFile(new URL(f, dir), "utf8"));
    const owner = randomUUID(),
      foreign = randomUUID(),
      seller = randomUUID();
    for (const id of [owner, foreign])
      await db.query("INSERT INTO troc.users(id,email) VALUES($1,$2)", [
        id,
        id + "@example.test",
      ]);
    await db.query(
      "INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status) VALUES($1,'cursor-store','Cursor','individual','active')",
      [seller],
    );
    await db.query(
      "INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES($1,$2,'owner')",
      [seller, owner],
    );
    await db.query(
      "INSERT INTO troc.marketplace_orders(id,buyer_id,total_cents,idempotency_key,status,address,demo_batch_id) SELECT md5('cursor-mo-'||g)::uuid,$1,100,'cursor-'||g,CASE WHEN g=252 THEN 'pending' ELSE 'simulated_paid' END,jsonb_build_object('recipient',CASE WHEN g=1 THEN 'Literal 50%_buyer' ELSE 'Buyer '||g END,'province','ON'),CASE WHEN g=1 THEN (SELECT id FROM troc.demo_batches WHERE seed_key='commerce-simulation') ELSE NULL END FROM generate_series(1,252)g",
      [owner],
    );
    await db.query(
      "INSERT INTO troc.seller_orders(id,marketplace_order_id,seller_id,merchandise_cents,shipping_cents,status,created_at,quote) SELECT md5('cursor-so-'||g)::uuid,md5('cursor-mo-'||g)::uuid,$1,100,0,CASE WHEN g%3=0 THEN 'refunded' WHEN g%3=1 THEN 'partially_refunded' ELSE 'awaiting_shipment' END,'2026-01-01T00:00:00Z'::timestamptz + (g%5)*interval '1 microsecond',jsonb_build_object('totalCents',g%11,'merchandiseCents',g%11,'shipping',jsonb_build_object('cents',0),'lines',jsonb_build_array(jsonb_build_object('quantity',1,'unitCents',g%11,'totalCents',g%11,'listing',jsonb_build_object('variantId',md5('cursor-variant-'||g)::uuid,'name',jsonb_build_object('en','English card','fr','Carte française'),'condition','NM')))) FROM generate_series(1,252)g",
      [seller],
    );
    const thumbnailBatches: unknown[][] = [];
    const store = {
      transaction: <T>(work: (sql: Sql) => Promise<T>) =>
        db.transaction(async (tx) => {
          await tx.exec("SET LOCAL ROLE troc_backend");
          return work(tx as Sql);
        }),
    };
    const sql: Sql = {
      query: (q, p) => {
        if (Array.isArray(p?.[0])) thumbnailBatches.push(p[0]);
        assert.ok(
          !q.includes("troc.order_messages"),
          "no message query on order-list",
        );
        return store.transaction((tx) => tx.query(q, p));
      },
    };
    const service = new SellerPlatformService(sql, store);
    const principal = (
      role: SellerRole = "owner",
      userId = owner,
    ): Principal => ({
      userId,
      roles: [],
      memberships: [{ sellerId: seller, role, active: true }],
    });
    for (const sort of ["new", "old", "total"]) {
      const ids: string[] = [];
      let cursor: string | null = null,
        asOf = "";
      do {
        const page = await sellerOrderList(sql, service, principal(), seller, {
          sort,
          limit: "17",
          ...(cursor ? { cursor } : {}),
        });
        assert.ok(page.orders.length <= 17);
        assert.ok(
          thumbnailBatches.at(-1)!.length <= 17,
          "only returned rows hydrate art",
        );
        assert.deepEqual(
          new Set(thumbnailBatches.at(-1)),
          new Set(page.orders.flatMap((o) => o.lines.map((l) => l.variantId))),
        );
        if (asOf) assert.equal(page.asOf, asOf);
        else asOf = page.asOf;
        ids.push(...page.orders.map((o) => o.id));
        cursor = page.nextCursor;
        if (cursor)
          assert.match(
            JSON.parse(Buffer.from(cursor, "base64url").toString()).after.at,
            /[.][0-9]{6}Z$/,
          );
        assert.ok(ids.length <= 251);
      } while (cursor);
      const ordering =
        sort === "old"
          ? "created_at ASC,id ASC"
          : sort === "total"
            ? "(quote->>'totalCents')::bigint DESC,created_at DESC,id DESC"
            : "created_at DESC,id DESC";
      const expected = await db.query<{ id: string }>(
        "SELECT id FROM troc.seller_orders WHERE marketplace_order_id<>md5('cursor-mo-252')::uuid ORDER BY " +
          ordering,
      );
      assert.deepEqual(
        ids,
        expected.rows.map((r) => r.id),
      );
      assert.equal(new Set(ids).size, 251);
    }
    const first = await sellerOrderList(sql, service, principal(), seller, {});
    for (const input of [
      { q: "changed" },
      { status: "refunded" },
      { lang: "fr" },
      { sort: "old" },
      { limit: "9" },
    ])
      await assert.rejects(
        () =>
          sellerOrderList(sql, service, principal(), seller, {
            ...input,
            cursor: first.nextCursor,
          }),
        /invalid_cursor/,
      );
    assert.throws(
      () => orderListInput(randomUUID(), { cursor: first.nextCursor }),
      /invalid_cursor/,
    );
    for (const cursor of [
      "",
      "!",
      "a".repeat(2049),
      Buffer.from("{}").toString("base64url"),
    ])
      assert.throws(() => orderListInput(seller, { cursor }), /invalid_cursor/);
    for (const input of [
      { limit: "51" },
      { limit: "0" },
      { limit: ["8"] },
      { q: "x".repeat(101) },
      { sort: "sql" },
      { status: "bad" },
      { period: "2" },
    ])
      assert.throws(() => orderListInput(seller, input), /invalid_input/);
    assert.equal(
      (await sellerOrderList(sql, service, principal(), seller, { q: "50%_" }))
        .orders.length,
      1,
    );
    assert.equal(
      (
        await sellerOrderList(sql, service, principal(), seller, {
          q: "' OR 1=1 --",
        })
      ).orders.length,
      0,
    );
    assert.equal(
      (
        await sellerOrderList(sql, service, principal(), seller, {
          q: "française",
          lang: "en",
        })
      ).orders.length,
      0,
    );
    assert.equal(
      (
        await sellerOrderList(sql, service, principal(), seller, {
          q: "française",
          lang: "fr",
        })
      ).orders.length,
      8,
    );
    const refunds = await sellerOrderList(sql, service, principal(), seller, {
      status: "refunded",
      limit: "50",
    });
    assert.ok(
      refunds.orders.every((o) =>
        ["refunded", "partially_refunded"].includes(o.status),
      ),
    );
    assert.equal(
      (
        await sellerOrderList(sql, service, principal(), seller, {
          period: "7",
        })
      ).orders.length,
      0,
    );
    for (const role of ["fulfillment", "customer_service"] as const)
      assert.equal(
        (await sellerOrderList(sql, service, principal(role), seller, {}))
          .orders.length,
        8,
      );
    await assert.rejects(
      () => sellerOrderList(sql, service, principal("inventory"), seller, {}),
      /forbidden/,
    );
    await assert.rejects(
      () =>
        sellerOrderList(sql, service, principal("owner", foreign), seller, {}),
      /forbidden/,
    );
    const summary = await sellerOrderSummary(
      sql,
      service,
      principal(),
      seller,
      { asOf: first.asOf },
    );
    assert.equal(summary.matchedCount, 251);
    assert.equal(
      summary.matchedTotalCents,
      Array.from({ length: 251 }, (_, i) => (i + 1) % 11).reduce(
        (a, b) => a + b,
        0,
      ),
    );
    assert.equal(
      Object.values(summary.priorities).reduce((a, b) => a + b, 0),
      251,
    );
    assert.equal(summary.tabs.refunded, 167);
    const filteredSummary = await sellerOrderSummary(
      sql,
      service,
      principal(),
      seller,
      { q: "50%_", status: "partially_refunded", asOf: first.asOf },
    );
    assert.equal(filteredSummary.matchedCount, 1);
    assert.equal(filteredSummary.matchedTotalCents, 1);
    assert.equal(filteredSummary.tabs.all, 1);
    assert.equal(
      Object.values(filteredSummary.priorities).reduce((a, b) => a + b, 0),
      251,
    );
    const emptySummary = await sellerOrderSummary(
      sql,
      service,
      principal(),
      seller,
      { q: "not present" },
    );
    assert.equal(emptySummary.matchedCount, 0);
    assert.equal(emptySummary.matchedTotalCents, 0);
    assert.equal(emptySummary.tabs.all, 0);
    const historical = await sellerOrderSummary(
      sql,
      service,
      principal(),
      seller,
      { asOf: "2026-01-01T00:00:00.000Z" },
    );
    assert.equal(historical.matchedCount, 50);
    assert.equal(
      (
        await sellerOrderSummary(sql, service, principal(), seller, {
          q: "française",
          lang: "fr",
        })
      ).matchedCount,
      251,
    );
    assert.equal(
      (
        await sellerOrderSummary(sql, service, principal(), seller, {
          q: "française",
          lang: "en",
        })
      ).matchedCount,
      0,
    );

    assert.equal(
      (
        await sellerOrderSummary(sql, service, principal(), seller, {
          q: "50%_",
        })
      ).containsDemo,
      true,
    );
    assert.equal(
      (
        await sellerOrderSummary(sql, service, principal(), seller, {
          status: "awaiting_shipment",
        })
      ).containsDemo,
      false,
    );
    for (const role of ["fulfillment", "customer_service"] as const)
      assert.equal(
        (await sellerOrderSummary(sql, service, principal(role), seller, {}))
          .matchedCount,
        251,
      );
    await assert.rejects(
      () =>
        sellerOrderSummary(sql, service, principal("inventory"), seller, {}),
      /forbidden/,
    );
    await assert.rejects(
      () =>
        sellerOrderSummary(
          sql,
          service,
          principal("owner", foreign),
          seller,
          {},
        ),
      /forbidden/,
    );
    await assert.rejects(
      () =>
        sellerOrderSummary(sql, service, principal(), seller, {
          cursor: first.nextCursor,
        }),
      /invalid_input/,
    );
    for (const asOf of [
      "not-date",
      "2026-02-31T00:00:00.000Z",
      "2999-01-01T00:00:00.000Z",
    ])
      assert.throws(() => orderListInput(seller, { asOf }), /invalid_input/);
    await assert.rejects(
      () =>
        sellerOrderList(sql, service, principal(), seller, {
          cursor: first.nextCursor,
          asOf: "2026-01-01T00:00:00.000Z",
        }),
      /invalid_cursor/,
    );
    // A sum beyond the JS serialization boundary must fail rather than round money.
    await db.exec(
      "UPDATE troc.seller_orders SET quote=jsonb_set(quote,'{totalCents}','9007199254740991') WHERE id IN (md5('cursor-so-1')::uuid,md5('cursor-so-2')::uuid)",
    );
    await assert.rejects(
      () => sellerOrderSummary(sql, service, principal(), seller, {}),
      /summary_out_of_range/,
    );
    await db.exec(
      "UPDATE troc.seller_orders SET quote=jsonb_set(quote,'{totalCents}',CASE WHEN id=md5('cursor-so-1')::uuid THEN '1'::jsonb ELSE '2'::jsonb END) WHERE id IN (md5('cursor-so-1')::uuid,md5('cursor-so-2')::uuid)",
    );
    const require = createRequire(
      new URL("../artifacts/api-server/package.json", import.meta.url),
    );
    const express: typeof import("express") = require("express");
    const app = express();
    app.use(sellerPlatformRouter(sql, store, async () => principal()));
    app.use(
      (error: unknown, _req: Request, res: Response, _next: NextFunction) =>
        res
          .status(error instanceof DomainError ? error.status : 500)
          .json({ error: true }),
    );
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    try {
      const address = server.address();
      assert.ok(address && typeof address !== "string");
      const url =
        "http://127.0.0.1:" +
        address.port +
        "/seller/platform/" +
        seller +
        "/order-list";
      const response = await fetch(url + "?limit=2&sort=old");
      assert.equal(response.status, 200);
      const summaryResponse = await fetch(
        url.replace("/order-list", "/order-summary") + "?status=refunded",
      );
      assert.equal(summaryResponse.status, 200);
      assert.equal((await summaryResponse.json()).matchedCount, 167);
      const payload = await response.json();
      assert.equal(payload.orders.length, 2);
      assert.equal(payload.appliedFilters.sort, "old");
      assert.ok(payload.nextCursor);
      assert.equal((await fetch(url + "?limit=51")).status, 400);
      assert.equal((await fetch(url + "?sort=old&sort=new")).status, 400);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
    await db.query(
      "UPDATE troc.seller_accounts SET status='suspended' WHERE id=$1",
      [seller],
    );
    await assert.rejects(
      () => sellerOrderList(sql, service, principal(), seller, {}),
      /forbidden/,
    );
  } finally {
    await db.close();
  }
});


import { sellerAnalyticsExport } from "../artifacts/api-server/src/modules/seller-platform/analytics-export";
import {
  sellerAnalyticsProducts,
  sellerAnalyticsBreakdown,
} from "../artifacts/api-server/src/modules/seller-platform/analytics-breakdown";
import { createRequire } from "node:module";
import type { Request, Response, NextFunction } from "express";
import { sellerPlatformRouter } from "../artifacts/api-server/src/routes/seller-platform";
import { DomainError } from "../artifacts/api-server/src/modules/shared/domain";
import { readFile, readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { sellerAnalyticsSummary } from "../artifacts/api-server/src/modules/seller-platform/analytics-summary";
import { SellerPlatformService } from "../artifacts/api-server/src/modules/seller-platform/service";
import { analytics } from "../artifacts/marketplace/src/modules/seller-platform/seller-analytics-model";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
import type {
  Principal,
  SellerRole,
} from "../artifacts/api-server/src/modules/auth/permissions";
import type { SellerQuote } from "@workspace/commerce";
test("full-scope analytics summary matches UTC model beyond200 with role enforcement", async () => {
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
      "INSERT INTO troc.marketplace_orders(id,buyer_id,total_cents,idempotency_key,status,address,demo_batch_id) SELECT md5('cursor-mo-'||g)::uuid,$1,100,'cursor-'||g,CASE WHEN g=420 THEN 'pending' ELSE 'simulated_paid' END,jsonb_build_object('recipient',CASE WHEN g=1 THEN 'Literal 50%_buyer' ELSE 'Buyer '||g END,'province','ON'),CASE WHEN g=1 THEN (SELECT id FROM troc.demo_batches WHERE seed_key='commerce-simulation') ELSE NULL END FROM generate_series(1,420)g",
      [owner],
    );
    await db.query(
      "INSERT INTO troc.seller_orders(id,marketplace_order_id,seller_id,merchandise_cents,shipping_cents,status,created_at,quote) SELECT md5('cursor-so-'||g)::uuid,md5('cursor-mo-'||g)::uuid,$1,100,0,CASE WHEN g%3=0 THEN 'refunded' WHEN g%3=1 THEN 'partially_refunded' ELSE 'awaiting_shipment' END,'2026-01-01T00:00:00Z'::timestamptz + (g%5)*interval '1 microsecond',jsonb_build_object('totalCents',g%11,'merchandiseCents',g%11,'shipping',jsonb_build_object('cents',0),'lines',jsonb_build_array(jsonb_build_object('quantity',1,'unitCents',g%11,'totalCents',g%11,'listing',jsonb_build_object('variantId',md5('cursor-variant-'||g)::uuid,'name',jsonb_build_object('en','English card','fr','Carte française'),'condition','NM')))) FROM generate_series(1,420)g",
      [seller],
    );

    await db.exec(
      "UPDATE troc.seller_orders so SET created_at='2026-01-15'::timestamptz-(g%180)*interval '1 day',refunded_cents=g%3,status=CASE WHEN g%17=0 THEN 'cancelled' ELSE so.status END FROM generate_series(1,420)g WHERE so.id=md5('cursor-so-'||g)::uuid",
    );

    await db.exec(
      "UPDATE troc.seller_orders so SET quote=jsonb_set(quote,'{lines,0,listing,variantId}',to_jsonb(md5('group-'||(g%37))::text)) FROM generate_series(1,420)g WHERE so.id=md5('cursor-so-'||g)::uuid",
    );
    // Canonical UUID form, not names, defines product groups.
    await db.exec(
      "UPDATE troc.seller_orders SET quote=jsonb_set(quote,'{lines,0,listing,variantId}',to_jsonb((quote->'lines'->0->'listing'->>'variantId')::uuid::text))",
    );
    const store = {
      transaction: <T>(work: (sql: Sql) => Promise<T>) =>
        db.transaction(async (tx) => {
          await tx.exec("SET LOCAL ROLE troc_backend");
          return work(tx as Sql);
        }),
    };
    const artworkBatches: unknown[][] = [];
    const sql: Sql = {
      query: (q, p) => {
        assert.ok(!q.includes("order_messages"));
        if (Array.isArray(p?.[0])) artworkBatches.push(p[0]);
        return store.transaction((tx) => tx.query(q, p));
      },
    };
    const service = new SellerPlatformService(sql, store);
    const principal = (role: SellerRole = "owner"): Principal => ({
      userId: owner,
      roles: [],
      memberships: [{ sellerId: seller, role, active: true }],
    });
    const asOf = "2026-01-15T12:00:00.000Z";
    const rows = (
      await db.query<{
        id: string;
        status: string;
        created_at: string;
        quote: SellerQuote;
        refunded_cents: number;
        demo: boolean;
      }>(
        "SELECT so.*,mo.demo_batch_id IS NOT NULL AS demo FROM troc.seller_orders so JOIN troc.marketplace_orders mo ON mo.id=so.marketplace_order_id WHERE mo.status<>'pending'",
      )
    ).rows;
    for (const dataset of ["live", "sample"])
      for (const period of ["7", "30", "90"]) {
        const source = rows
          .filter((r) => r.demo === (dataset === "sample"))
          .map((r) => ({
            id: r.id,
            status: r.status,
            createdAt: new Date(r.created_at).toISOString(),
            buyer: "fixture",
            province: "ON",
            demo: r.demo,
            totalCents: r.quote.totalCents,
            merchandiseCents: r.quote.merchandiseCents,
            shippingCents: r.quote.shipping.cents,
            refundedCents: r.refunded_cents,
            messageCount: 0,
            lastMessage: null,
            messageAt: null,
            lines: r.quote.lines.map((l) => ({
              name: l.listing.name,
              quantity: l.quantity,
              unitCents: l.unitCents,
              totalCents: l.totalCents,
              variantId: l.listing.variantId,
              condition: l.listing.condition,
              imageUrl: null,
            })),
          }));
        const expected = analytics(source, Number(period), Date.parse(asOf));
        const actual = await sellerAnalyticsSummary(
          sql,
          service,
          principal(),
          seller,
          { period, dataset, asOf },
        );
        const exported = await sellerAnalyticsExport(
          sql,
          service,
          principal(),
          seller,
          { period, dataset, asOf },
        );
        assert.equal(exported.rows, expected.orders.length);
        assert.equal(
          exported.csv.split("\r\n").length,
          expected.orders.length + 1,
        );
        for (const order of expected.orders)
          assert.ok(exported.csv.includes('"' + order.id + '"'));
        assert.equal(actual.orderCount, expected.orders.length);
        assert.equal(actual.totalCents, expected.total);
        assert.equal(actual.previousTotalCents, expected.previousTotal);
        assert.equal(actual.refundCents, expected.refunds);
        assert.equal(actual.units, expected.units);
        assert.equal(
          actual.refundOrderCount,
          expected.orders.filter((o) => o.refundedCents > 0).length,
        );
        assert.deepEqual(
          actual.series.map((r) => ({
            day: r.day,
            value: r.totalCents / 100,
            orders: r.orders,
            previous: r.previousTotalCents / 100,
            previousOrders: r.previousOrders,
          })),
          expected.series,
        );

        const expectedProducts = expected.products.sort(
          (a, b) => b.cents - a.cents || b.variantId.localeCompare(a.variantId),
        );
        const products: {
          variantId: string;
          quantity: number;
          cents: number;
        }[] = [];
        let cursor: string | null = null;
        let firstCursor: string | null = null;
        do {
          const page = await sellerAnalyticsProducts(
            sql,
            service,
            principal(),
            seller,
            {
              period,
              dataset,
              asOf,
              limit: "8",
              ...(cursor ? { cursor } : {}),
            },
          );
          assert.ok(page.products.length <= 8);
          assert.deepEqual(
            artworkBatches.at(-1),
            page.products.map((r) => r.variantId),
          );
          products.push(
            ...page.products.map((r) => ({
              variantId: r.variantId,
              quantity: r.quantity,
              cents: r.cents,
            })),
          );
          cursor = page.nextCursor;
          if (!firstCursor) firstCursor = cursor;
          assert.ok(products.length <= expectedProducts.length);
        } while (cursor);
        assert.deepEqual(
          products,
          expectedProducts.map((r) => ({
            variantId: r.variantId,
            quantity: r.quantity,
            cents: r.cents,
          })),
        );
        if (firstCursor)
          await assert.rejects(
            () =>
              sellerAnalyticsProducts(sql, service, principal(), seller, {
                period,
                dataset,
                asOf,
                limit: "9",
                cursor: firstCursor,
              }),
            /invalid_cursor/,
          );
        const breakdown = await sellerAnalyticsBreakdown(
          sql,
          service,
          principal(),
          seller,
          { period, dataset, asOf },
        );
        assert.deepEqual(
          breakdown.provinces.map((r) => [r.province, r.count]),
          expected.provinces,
        );
        assert.equal(breakdown.provincesTruncated, false);
        assert.deepEqual(breakdown.datasets, { live: true, sample: true });
        if (period === "90" && dataset === "live")
          assert.ok(actual.orderCount > 200);
      }

    await db.exec(
      "UPDATE troc.marketplace_orders SET address=jsonb_set(address,'{province}','\"QC\"') WHERE id IN(SELECT md5('cursor-mo-'||g)::uuid FROM generate_series(2,10)g); UPDATE troc.marketplace_orders SET address=jsonb_set(address,'{province}','\"\"') WHERE id=md5('cursor-mo-11')::uuid",
    );
    const provinceExpected = (
      await db.query<{ province: string; count: string }>(
        "SELECT COALESCE(NULLIF(mo.address->>'province',''),'—') AS province,count(*)::text AS count FROM troc.seller_orders so JOIN troc.marketplace_orders mo ON mo.id=so.marketplace_order_id WHERE so.seller_id=$1 AND mo.demo_batch_id IS NULL AND mo.status<>'pending' AND so.status<>'cancelled' AND so.created_at>='2025-10-18' AND so.created_at<'2026-01-16' GROUP BY 1 ORDER BY count(*) DESC,1",
        [seller],
      )
    ).rows;
    const regions = await sellerAnalyticsBreakdown(
      sql,
      service,
      principal(),
      seller,
      { period: "90", asOf },
    );
    assert.deepEqual(
      regions.provinces,
      provinceExpected.map((r) => ({
        province: r.province,
        count: Number(r.count),
      })),
    );
    assert.ok(regions.provinces.some((r) => r.province === "—"));
    await db.exec(
      "UPDATE troc.seller_orders SET created_at='2026-01-15T11:00:00Z',quote=jsonb_set(quote,'{lines,0,listing,name}','{\"en\":\"Latest snapshot\",\"fr\":\"Version recente\"}') WHERE id=md5('cursor-so-2')::uuid",
    );
    const named = await sellerAnalyticsProducts(
      sql,
      service,
      principal(),
      seller,
      { period: "90", limit: "50", asOf },
    );
    const group = (
      await db.query<{ id: string }>("SELECT md5('group-2')::uuid AS id")
    ).rows[0].id;
    assert.equal(
      named.products.find((r) => r.variantId === group)?.name.en,
      "Latest snapshot",
    );
    await assert.rejects(
      () =>
        sellerAnalyticsProducts(sql, service, principal(), seller, {
          limit: "51",
        }),
      /invalid_input/,
    );
    await assert.rejects(
      () =>
        sellerAnalyticsProducts(sql, service, principal(), seller, {
          cursor: "!",
        }),
      /invalid_cursor/,
    );
    const empty = await sellerAnalyticsSummary(
      sql,
      service,
      principal(),
      seller,
      { asOf: "1900-01-01T00:00:00.000Z" },
    );
    assert.equal(empty.orderCount, 0);
    assert.equal(empty.totalCents, 0);
    assert.equal(empty.series.length, 30);
    assert.ok(
      empty.series.every(
        (r) => r.totalCents === 0 && r.previousTotalCents === 0,
      ),
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
        "/analytics-summary";
      const response = await fetch(
        url + "?dataset=sample&asOf=" + encodeURIComponent(asOf),
      );
      assert.equal(response.status, 200);
      assert.equal((await response.json()).orderCount, 1);
      assert.equal((await fetch(url + "?period=365")).status, 400);
      const exportResponse = await fetch(url.replace("/analytics-summary", "/analytics-export") + "?dataset=sample&asOf=" + encodeURIComponent(asOf));
      assert.equal(exportResponse.status,200);
      assert.equal(exportResponse.headers.get("cache-control"),"no-store");
      assert.equal((await exportResponse.json()).rows,1);
      const productsResponse = await fetch(
        url.replace("/analytics-summary", "/analytics-products") +
          "?period=90&limit=8&asOf=" +
          encodeURIComponent(asOf),
      );
      assert.equal(productsResponse.status, 200);
      const productPayload = await productsResponse.json();
      assert.equal(productPayload.products.length, 8);
      assert.ok(productPayload.nextCursor);
      const breakdownResponse = await fetch(
        url.replace("/analytics-summary", "/analytics-breakdown") +
          "?asOf=" +
          encodeURIComponent(asOf),
      );
      assert.equal(breakdownResponse.status, 200);
      assert.deepEqual((await breakdownResponse.json()).datasets, {
        live: true,
        sample: true,
      });
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
    for (const role of [
      "inventory",
      "fulfillment",
      "customer_service",
      "manager",
    ] as const) {
      await db.query(
        "UPDATE troc.seller_members SET role=$1 WHERE seller_id=$2 AND user_id=$3",
        [role, seller, owner],
      );
      if (role === "manager")
        assert.ok(
          (
            await sellerAnalyticsSummary(
              sql,
              service,
              principal(role),
              seller,
              { asOf },
            )
          ).orderCount > 0,
        );
      else
        await assert.rejects(
          () =>
            sellerAnalyticsSummary(sql, service, principal(role), seller, {
              asOf,
            }),
          /forbidden/,
        );
    }
    await db.query(
      "UPDATE troc.seller_members SET role='inventory' WHERE seller_id=$1",
      [seller],
    );
    await assert.rejects(
      () =>
        sellerAnalyticsProducts(sql, service, principal("inventory"), seller, {
          asOf,
        }),
      /forbidden/,
    );
    await assert.rejects(
      () =>
        sellerAnalyticsBreakdown(sql, service, principal("inventory"), seller, {
          asOf,
        }),
      /forbidden/,
    );
    await db.query(
      "UPDATE troc.seller_members SET role='owner' WHERE seller_id=$1",
      [seller],
    );
    for (const input of [
      { period: "365" },
      { dataset: "all" },
      { dataset: ["live"] },
      { asOf: "bad" },
    ])
      await assert.rejects(
        () => sellerAnalyticsSummary(sql, service, principal(), seller, input),
        /invalid_input/,
      );

    await db.exec(
      "UPDATE troc.seller_orders SET quote=jsonb_set(quote,'{lines,0,totalCents}','9007199254740991') WHERE id IN(md5('cursor-so-2')::uuid,md5('cursor-so-39')::uuid)",
    );
    await assert.rejects(
      () =>
        sellerAnalyticsProducts(sql, service, principal(), seller, {
          period: "90",
          asOf,
        }),
      /summary_out_of_range/,
    );
    await db.exec(
      "UPDATE troc.seller_orders SET quote=jsonb_set(quote,'{totalCents}','9007199254740991') WHERE id IN(md5('cursor-so-2')::uuid,md5('cursor-so-3')::uuid)",
    );
    await assert.rejects(
      () => sellerAnalyticsSummary(sql, service, principal(), seller, { asOf }),
      /summary_out_of_range/,
    );
    await db.query(
      "UPDATE troc.marketplace_orders SET address=jsonb_set(address,'{recipient}',to_jsonb($1::text)) WHERE id=md5('cursor-mo-2')::uuid",
      ['=HYPERLINK("unsafe")'],
    );
    const csv = await sellerAnalyticsExport(sql, service, principal(), seller, {
      period: "90",
      asOf,
    });
    assert.ok(csv.csv.includes('\'=HYPERLINK(""unsafe"")'));
    assert.ok(csv.csv.includes('"90071992547409.91"'));
    await db.query("UPDATE troc.marketplace_orders SET address=jsonb_set(address,'{recipient}',to_jsonb($1::text)) WHERE id=md5('cursor-mo-2')::uuid",["x".repeat(5*1024*1024)]);
    await assert.rejects(()=>sellerAnalyticsExport(sql,service,principal(),seller,{period:"90",asOf}),/export_too_large/);
    const overflow: Sql = {
      query: (q, p) =>
        q.includes("LIMIT $5")
          ? (Promise.resolve({
              rows: Array.from({ length: 10001 }, () => ({})),
            }) as ReturnType<Sql["query"]>)
          : sql.query(q, p),
    };
    await assert.rejects(
      () =>
        sellerAnalyticsExport(overflow, service, principal(), seller, { asOf }),
      /export_too_large/,
    );
    await db.query(
      "UPDATE troc.seller_members SET role='inventory' WHERE seller_id=$1",
      [seller],
    );
    await assert.rejects(
      () =>
        sellerAnalyticsExport(sql, service, principal("inventory"), seller, {
          asOf,
        }),
      /forbidden/,
    );
    const stranger: Principal = { userId: foreign, roles: [], memberships: [] };
    await assert.rejects(
      () => sellerAnalyticsSummary(sql, service, stranger, seller, {}),
      /forbidden/,
    );
  } finally {
    await db.close();
  }
});

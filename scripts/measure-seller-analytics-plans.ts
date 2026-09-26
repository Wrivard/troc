import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { sellerAnalyticsSummary } from "../artifacts/api-server/src/modules/seller-platform/analytics-summary";
import {
  sellerAnalyticsProducts,
  sellerAnalyticsBreakdown,
} from "../artifacts/api-server/src/modules/seller-platform/analytics-breakdown";
import { SellerPlatformService } from "../artifacts/api-server/src/modules/seller-platform/service";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
const db = new PGlite({ extensions: { pg_trgm } });
try {
  const dir = new URL("../lib/db/migrations/", import.meta.url);
  for (const f of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort())
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
    "INSERT INTO troc.marketplace_orders(id,buyer_id,total_cents,idempotency_key,status,address,demo_batch_id) SELECT md5('cursor-mo-'||g)::uuid,$1,100,'cursor-'||g,CASE WHEN g=20000 THEN 'pending' ELSE 'simulated_paid' END,jsonb_build_object('recipient',CASE WHEN g=1 THEN 'Literal 50%_buyer' ELSE 'Buyer '||g END,'province','ON'),CASE WHEN g=1 THEN (SELECT id FROM troc.demo_batches WHERE seed_key='commerce-simulation') ELSE NULL END FROM generate_series(1,20000)g",
    [owner],
  );
  await db.query(
    "INSERT INTO troc.seller_orders(id,marketplace_order_id,seller_id,merchandise_cents,shipping_cents,status,created_at,quote) SELECT md5('cursor-so-'||g)::uuid,md5('cursor-mo-'||g)::uuid,$1,100,0,CASE WHEN g%3=0 THEN 'refunded' WHEN g%3=1 THEN 'partially_refunded' ELSE 'awaiting_shipment' END,'2026-01-01T00:00:00Z'::timestamptz + (g%5)*interval '1 microsecond',jsonb_build_object('totalCents',g%11,'merchandiseCents',g%11,'shipping',jsonb_build_object('cents',0),'lines',jsonb_build_array(jsonb_build_object('quantity',1,'unitCents',g%11,'totalCents',g%11,'listing',jsonb_build_object('variantId',md5('cursor-variant-'||g)::uuid,'name',jsonb_build_object('en','English card','fr','Carte française'),'condition','NM')))) FROM generate_series(1,20000)g",
    [seller],
  );

  await db.exec(
    "UPDATE troc.seller_orders so SET created_at='2026-01-15'::timestamptz-(g%730)*interval '1 day',quote=jsonb_set(quote,'{lines}',(SELECT jsonb_agg(jsonb_set(quote->'lines'->0,'{listing,variantId}',to_jsonb(md5('variant-'||((g+h)%1000))::uuid::text))) FROM generate_series(1,4)h)) FROM generate_series(1,20000)g WHERE so.id=md5('cursor-so-'||g)::uuid",
  );
  await db.exec("ANALYZE troc.seller_orders; ANALYZE troc.marketplace_orders");
  const store = {
    transaction: <T>(work: (sql: Sql) => Promise<T>) =>
      db.transaction(async (tx) => {
        await tx.exec("SET LOCAL ROLE troc_backend");
        return work(tx as Sql);
      }),
  };
  let captured: { q: string; p: unknown[] }[] = [];
  const sql: Sql = {
    query: (q, p) => {
      if (q.includes("troc.seller_orders")) captured.push({ q, p: p ?? [] });
      return store.transaction((tx) => tx.query(q, p));
    },
  };
  const service = new SellerPlatformService(sql, store),
    principal = {
      userId: owner,
      roles: [],
      memberships: [{ sellerId: seller, role: "owner" as const, active: true }],
    };
  const results: unknown[] = [];
  for (const period of ["7", "30", "90"]) {
    const input = { period, dataset: "live", asOf: "2026-01-15T12:00:00.000Z" };
    for (const [name, read] of [
      ["summary", sellerAnalyticsSummary],
      ["products", sellerAnalyticsProducts],
      ["breakdown", sellerAnalyticsBreakdown],
    ] as const) {
      captured = [];
      const response = await read(sql, service, principal, seller, input);
      const queries = [...captured];
      assert.equal(queries.length, 1);
      if ("orderCount" in response) assert.ok(response.orderCount > 0);
      if ("products" in response) assert.equal(response.products.length, 25);
      const plans = [];
      for (let trial = 0; trial < 3; trial++)
        plans.push(
          (
            await store.transaction((tx) =>
              tx.query(
                "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + queries[0].q,
                queries[0].p,
              ),
            )
          ).rows,
        );
      results.push({ name, period, plans });
      console.log(
        name,
        period,
        JSON.stringify(
          plans.map(
            (p) =>
              (p[0] as { "QUERY PLAN": { "Execution Time": number }[] })[
                "QUERY PLAN"
              ][0]["Execution Time"],
          ),
        ),
      );
    }
  }
  const legacySql: Sql = {
    query: (q, p) =>
      store.transaction((tx) =>
        tx.query(
          q.replace("eligible AS NOT MATERIALIZED", "eligible AS MATERIALIZED"),
          p,
        ),
      ),
  };
  let parityChecks = 0;
  for (const mode of ["mixed", "no-sample"]) {
    if (mode === "no-sample")
      await db.exec(
        "UPDATE troc.seller_orders SET status='cancelled' WHERE marketplace_order_id IN (SELECT id FROM troc.marketplace_orders WHERE demo_batch_id IS NOT NULL)",
      );
    for (const dataset of ["live", "sample"])
      for (const period of ["7", "30", "90"]) {
        const input = { period, dataset, asOf: "2026-01-15T12:00:00.000Z" };
        const actual = await sellerAnalyticsBreakdown(
          sql,
          service,
          principal,
          seller,
          input,
        );
        assert.deepEqual(
          actual,
          await sellerAnalyticsBreakdown(
            legacySql,
            service,
            principal,
            seller,
            input,
          ),
        );
        parityChecks++;
        if (mode === "no-sample") assert.equal(actual.datasets.sample, false);
      }
  }
  console.log(
    "Twelve breakdown parity checks pass, including absent sample dataset",
  );
  const out = new URL(
    "../docs/evidence/seller-analytics-plans/",
    import.meta.url,
  );
  await mkdir(out, { recursive: true });
  await writeFile(
    new URL(
      process.argv.includes("--optimized") ? "optimized.json" : "baseline.json",
      out,
    ),
    JSON.stringify(
      {
        environment:
          "Disposable PGlite;20000orders/80000lines/1000variants;730-day history;3warm plans per read",
        results,
        parityChecks,
      },
      null,
      2,
    ),
  );
} finally {
  await db.close();
}

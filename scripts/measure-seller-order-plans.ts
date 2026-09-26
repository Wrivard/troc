// Disposable SQL-plan probe. Never connects to the preview or a hosted database.
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import assert from "node:assert/strict";
import {
  sellerOrderList,
  orderListInput,
} from "../artifacts/api-server/src/modules/seller-platform/order-list";
import { sellerOrderSummary } from "../artifacts/api-server/src/modules/seller-platform/order-summary";
import { SellerPlatformService } from "../artifacts/api-server/src/modules/seller-platform/service";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
const db = new PGlite({ extensions: { pg_trgm } });
try {
  const dir = new URL("../lib/db/migrations/", import.meta.url);
  for (const f of (await readdir(dir))
    .filter((f) => f.endsWith(".sql") && !f.startsWith("0024_"))
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
    "INSERT INTO troc.marketplace_orders(id,buyer_id,total_cents,idempotency_key,status,address,demo_batch_id) SELECT md5('cursor-mo-'||g)::uuid,$1,100,'cursor-'||g,CASE WHEN g=20000 THEN 'pending' ELSE 'simulated_paid' END,jsonb_build_object('recipient',CASE WHEN g=1 THEN 'Literal 50%_buyer' ELSE 'Buyer '||g END,'province','ON'),CASE WHEN g=1 THEN (SELECT id FROM troc.demo_batches WHERE seed_key='commerce-simulation') ELSE NULL END FROM generate_series(1,20000)g",
    [owner],
  );
  await db.query(
    "INSERT INTO troc.seller_orders(id,marketplace_order_id,seller_id,merchandise_cents,shipping_cents,status,created_at,quote) SELECT md5('cursor-so-'||g)::uuid,md5('cursor-mo-'||g)::uuid,$1,100,0,CASE WHEN g%3=0 THEN 'refunded' WHEN g%3=1 THEN 'partially_refunded' ELSE 'awaiting_shipment' END,'2026-01-01T00:00:00Z'::timestamptz + (g%5)*interval '1 microsecond',jsonb_build_object('totalCents',g%11,'merchandiseCents',g%11,'shipping',jsonb_build_object('cents',0),'lines',jsonb_build_array(jsonb_build_object('quantity',1,'unitCents',g%11,'totalCents',g%11,'listing',jsonb_build_object('variantId',md5('cursor-variant-'||g)::uuid,'name',jsonb_build_object('en','English card','fr','Carte française'),'condition','NM')))) FROM generate_series(1,20000)g",
    [seller],
  );

  await db.exec("ANALYZE troc.seller_orders; ANALYZE troc.marketplace_orders; ANALYZE troc.seller_order_search");
  const captured: { q: string; p: unknown[] }[] = [];
  const store = {
    transaction: <T>(work: (sql: Sql) => Promise<T>) =>
      db.transaction(async (tx) => {
        await tx.exec("SET LOCAL ROLE troc_backend");
        return work(tx as Sql);
      }),
  };
  const sql: Sql = {
    query: (q, p) => {
      if (q.includes("FROM troc.seller_orders so JOIN"))
        captured.push({ q, p: p ?? [] });
      return store.transaction((tx) => tx.query(q, p));
    },
  };
  const service = new SellerPlatformService(sql, store);
  const principal = {
    userId: owner,
    roles: [],
    memberships: [{ sellerId: seller, role: "owner" as const, active: true }],
  };
  const results: unknown[] = [];
  for (const stage of ["search-index-only", "candidate-index"]) {
    if (stage === "candidate-index") {
      await db.exec(
        await readFile(
          new URL(
            "../lib/db/migrations/0024_seller_order_read_indexes.sql",
            import.meta.url,
          ),
          "utf8",
        ),
      );
      await db.exec("ANALYZE troc.seller_orders");
    }
    for (const sort of ["new", "old", "total"]) {
      const order =
        sort === "old"
          ? "so.created_at ASC,so.id ASC"
          : sort === "total"
            ? "COALESCE((so.quote->>'totalCents')::bigint,0) DESC,so.created_at DESC,so.id DESC"
            : "so.created_at DESC,so.id DESC";
      const reference = await db.query<{
        id: string;
        at: string;
        total: number;
      }>(
        "SELECT so.id,to_char(so.created_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"') AS at,(so.quote->>'totalCents')::int AS total FROM troc.seller_orders so JOIN troc.marketplace_orders mo ON mo.id=so.marketplace_order_id WHERE so.seller_id=$1 AND mo.status<>'pending' ORDER BY " +
          order +
          " OFFSET 15000 LIMIT 9",
        [seller],
      );
      const f = orderListInput(seller, { sort });
      const cursor = Buffer.from(
        JSON.stringify({
          v: 1,
          scope: f.scope,
          asOf: f.asOf,
          after: reference.rows[0],
        }),
      ).toString("base64url");
      captured.length = 0;
      const page = await sellerOrderList(sql, service, principal, seller, {
        sort,
        cursor,
      });
      assert.deepEqual(
        page.orders.map((o) => o.id),
        reference.rows.slice(1).map((o) => o.id),
      );
      for (const { q, p } of captured) {
        const plan = await store.transaction((tx) =>
          tx.query("EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + q, p),
        );
        results.push({
          stage,
          kind: "deep-list",
          input: { sort, offsetReference: 15000 },
          plan: plan.rows,
        });
      }
    }
    for (const input of [
      { sort: "new" },
      { sort: "old" },
      { sort: "total" },
      { q: "English" },
      { q: "50%_" },
      { q: "absent" },
    ]) {
      for (const kind of ["list", "summary"]) {
        captured.length = 0;
        if (kind === "list")
          await sellerOrderList(sql, service, principal, seller, input);
        else await sellerOrderSummary(sql, service, principal, seller, input);
        for (const { q, p } of captured) {
          const plan = await store.transaction((tx) =>
            tx.query("EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + q, p),
          );
          results.push({ stage, kind, input, plan: plan.rows });
        }
      }
    }
  }
  const evidenceDir = new URL(
    "../docs/evidence/seller-order-plans/",
    import.meta.url,
  );
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(
    new URL("plans-next-run.json", evidenceDir),
    JSON.stringify(
      {
        environment:
          "disposable PGlite; 20000 orders, 19999 eligible; timestamp ties; not hosted capacity evidence",
        results,
      },
      null,
      2,
    ),
  );
  console.log(
    "Captured",
    results.length,
    "query plans; fixture database closed afterward.",
  );
} finally {
  await db.close();
}

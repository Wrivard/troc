import { sellerOrderList } from "../artifacts/api-server/src/modules/seller-platform/order-list";
import { SellerPlatformService } from "../artifacts/api-server/src/modules/seller-platform/service";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
// Isolated query strategy experiment; no preview or hosted connection.
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import {
  orderListInput,
  orderListConditions,
} from "../artifacts/api-server/src/modules/seller-platform/order-list";
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
    "ANALYZE troc.seller_orders; ANALYZE troc.marketplace_orders; ANALYZE troc.seller_order_search",
  );
  const results: unknown[] = [];
  const store = {
    transaction: <T>(work: (sql: Sql) => Promise<T>) =>
      db.transaction(async (tx) => {
        await tx.exec("SET LOCAL ROLE troc_backend");
        return work(tx as Sql);
      }),
  };
  const sql: Sql = {
    query: (q, p) => store.transaction((tx) => tx.query(q, p)),
  };
  const service = new SellerPlatformService(sql, store);
  const principal = {
    userId: owner,
    roles: [],
    memberships: [{ sellerId: seller, role: "owner" as const, active: true }],
  };
  let integratedChecks = 0;

  const query = (q: string, args: unknown[]) =>
    db.transaction(async (tx) => {
      await tx.exec("SET LOCAL ROLE troc_backend");
      return tx.query<{ id: string }>(q, args);
    });
  for (const lang of ["en", "fr"])
    for (const q of ["English", "Carte", "absent", "50%_", "a", "50"])
      for (const sort of ["new", "old", "total"]) {
        const f = orderListInput(seller, { q, lang, sort });
        const { args, where } = orderListConditions(seller, f);
        const raw = where.pop()!;
        const from =
          " FROM troc.seller_orders so JOIN troc.marketplace_orders mo ON mo.id=so.marketplace_order_id WHERE " +
          where.join(" AND ");
        const select =
          "SELECT so.id,so.created_at AS at,COALESCE((so.quote->>'totalCents')::bigint,0) AS total";
        const order =
          sort === "old"
            ? "at ASC,id ASC"
            : sort === "total"
              ? "total DESC,at DESC,id DESC"
              : "at DESC,id DESC";
        const reference =
          select + from + " AND " + raw + " ORDER BY " + order + " LIMIT 9";
        // Cap selects a strategy, never caps the returned logical search results.
        const candidate =
          "WITH candidates AS MATERIALIZED (SELECT order_id FROM troc.seller_order_search WHERE seller_id=$1 AND " +
          lang +
          " LIKE $3 AND $4::text IN ('en','fr') LIMIT 257) " +
          "(" +
          select +
          from +
          " AND (SELECT count(*) FROM candidates)<=256 AND so.id=ANY(ARRAY(SELECT order_id FROM candidates)) ORDER BY " +
          order +
          " LIMIT 9) UNION ALL (" +
          select +
          from +
          " AND (SELECT count(*) FROM candidates)>256 AND EXISTS(SELECT 1 FROM troc.seller_order_search search WHERE search.order_id=so.id AND search.seller_id=so.seller_id AND search." +
          lang +
          " LIKE $3 OFFSET 0) ORDER BY " +
          order +
          " LIMIT 9) ORDER BY " +
          order;
        assert.deepEqual(
          (await query(candidate, args)).rows,
          (await query(reference, args)).rows,
        );

        const first = await sellerOrderList(sql, service, principal, seller, {
          q,
          lang,
          sort,
          limit: "9",
        });
        assert.deepEqual(
          first.orders.map((o) => o.id),
          (await query(reference, args)).rows.map((o) => o.id),
        );
        integratedChecks++;
        const deep = await db.query<{ id: string; at: string; total: number }>(
          "SELECT so.id,to_char(so.created_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"') AS at,(so.quote->>'totalCents')::int AS total" +
            from +
            " AND " +
            raw +
            " ORDER BY " +
            (sort === "old"
              ? "so.created_at ASC,so.id ASC"
              : sort === "total"
                ? "(so.quote->>'totalCents')::bigint DESC,so.created_at DESC,so.id DESC"
                : "so.created_at DESC,so.id DESC") +
            " OFFSET 1000 LIMIT 10",
          args,
        );
        if (deep.rows.length > 1) {
          const scope = orderListInput(seller, { q, lang, sort, limit: "9" });
          const cursor = Buffer.from(
            JSON.stringify({
              v: 1,
              scope: scope.scope,
              asOf: scope.asOf,
              after: deep.rows[0],
            }),
          ).toString("base64url");
          const page = await sellerOrderList(sql, service, principal, seller, {
            q,
            lang,
            sort,
            limit: "9",
            cursor,
          });
          assert.deepEqual(
            page.orders.map((o) => o.id),
            deep.rows.slice(1).map((o) => o.id),
          );
          integratedChecks++;
        }
        const plan = (
          await query(
            "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + candidate,
            args,
          )
        ).rows;
        results.push({ q, lang, sort, plan });
      }

  // Exercise both sides of the exact strategy threshold, across every page.
  for (const count of [256, 257]) {
    const label = "Threshold " + count;
    await db.query(
      "UPDATE troc.marketplace_orders SET address=jsonb_build_object('recipient',$1::text) WHERE id IN (SELECT md5('cursor-mo-'||g)::uuid FROM generate_series(1,$2::int)g)",
      [label, count],
    );
    for (const sort of ["new", "old", "total"]) {
      const ids: string[] = [];
      let cursor: string | null = null;
      do {
        const page = await sellerOrderList(sql, service, principal, seller, {
          q: label,
          sort,
          limit: "50",
          ...(cursor ? { cursor } : {}),
        });
        ids.push(...page.orders.map((o) => o.id));
        cursor = page.nextCursor;
        assert.ok(ids.length <= count);
      } while (cursor);
      assert.equal(ids.length, count);
      assert.equal(new Set(ids).size, count);
      integratedChecks++;
    }
  }
  const dirOut = new URL(
    "../docs/evidence/seller-order-search-strategy/",
    import.meta.url,
  );
  await mkdir(dirOut, { recursive: true });
  await writeFile(
    new URL("plans.json", dirOut),
    JSON.stringify(
      {
        environment:
          "PGlite20000orders;36first-page parity checks; candidate strategy only",
        results,
        integratedChecks,
      },
      null,
      2,
    ),
  );
  console.log(
    results.length,
    "same-statement bounded-strategy parity cases passed; integrated checks=" +
      integratedChecks,
  );
} finally {
  await db.close();
}

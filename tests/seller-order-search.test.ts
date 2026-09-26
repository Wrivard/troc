import { readFile, readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
test("private order search backfill and transactional source maintenance", async () => {
  const db = new PGlite({ extensions: { pg_trgm } });
  try {
    const dir = new URL("../lib/db/migrations/", import.meta.url);
    for (const f of (await readdir(dir))
      .filter((f) => f.endsWith(".sql") && !f.startsWith("0025_"))
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
      "INSERT INTO troc.marketplace_orders(id,buyer_id,total_cents,idempotency_key,status,address,demo_batch_id) SELECT md5('cursor-mo-'||g)::uuid,$1,100,'cursor-'||g,CASE WHEN g=40 THEN 'pending' ELSE 'simulated_paid' END,jsonb_build_object('recipient',CASE WHEN g=1 THEN 'Literal 50%_buyer' ELSE 'Buyer '||g END,'province','ON'),CASE WHEN g=1 THEN (SELECT id FROM troc.demo_batches WHERE seed_key='commerce-simulation') ELSE NULL END FROM generate_series(1,40)g",
      [owner],
    );
    await db.query(
      "INSERT INTO troc.seller_orders(id,marketplace_order_id,seller_id,merchandise_cents,shipping_cents,status,created_at,quote) SELECT md5('cursor-so-'||g)::uuid,md5('cursor-mo-'||g)::uuid,$1,100,0,CASE WHEN g%3=0 THEN 'refunded' WHEN g%3=1 THEN 'partially_refunded' ELSE 'awaiting_shipment' END,'2026-01-01T00:00:00Z'::timestamptz + (g%5)*interval '1 microsecond',jsonb_build_object('totalCents',g%11,'merchandiseCents',g%11,'shipping',jsonb_build_object('cents',0),'lines',jsonb_build_array(jsonb_build_object('quantity',1,'unitCents',g%11,'totalCents',g%11,'listing',jsonb_build_object('variantId',md5('cursor-variant-'||g)::uuid,'name',jsonb_build_object('en','English card','fr','Carte française'),'condition','NM')))) FROM generate_series(1,40)g",
      [seller],
    );

    const migration = await readFile(
      new URL(
        "../lib/db/migrations/0025_seller_order_search.sql",
        import.meta.url,
      ),
      "utf8",
    );
    await db.exec(migration);
    async function parity() {
      const source = await db.query(
        "SELECT so.id AS order_id,so.seller_id,lower(so.id::text||' '||COALESCE(NULLIF(mo.address->>'recipient',''),'Buyer')||' '||COALESCE((SELECT string_agg(line->'listing'->'name'->>'en',' ') FROM jsonb_array_elements(so.quote->'lines') line),'')) AS en,lower(so.id::text||' '||COALESCE(NULLIF(mo.address->>'recipient',''),'Buyer')||' '||COALESCE((SELECT string_agg(line->'listing'->'name'->>'fr',' ') FROM jsonb_array_elements(so.quote->'lines') line),'')) AS fr FROM troc.seller_orders so JOIN troc.marketplace_orders mo ON mo.id=so.marketplace_order_id ORDER BY so.id",
      );
      const projection = await db.query(
        "SELECT * FROM troc.seller_order_search ORDER BY order_id",
      );
      assert.deepEqual(projection.rows, source.rows);
    }
    await parity(); // migration backfill
    await db.exec(
      "UPDATE troc.marketplace_orders SET address=jsonb_build_object('recipient','Changed buyer') WHERE id=md5('cursor-mo-1')::uuid",
    );
    await parity();
    await db.query(
      "UPDATE troc.seller_orders SET quote=jsonb_set(quote,'{lines}',$1::jsonb) WHERE id=md5('cursor-so-1')::uuid",
      [
        JSON.stringify([
          { listing: { name: { en: "Alpha 50%_ \\", fr: "Étoile" } } },
          { listing: { name: { en: "Beta" } } },
        ]),
      ],
    );
    await parity();
    await assert.rejects(
      () =>
        db.transaction(async (tx) => {
          await tx.exec(
            "UPDATE troc.marketplace_orders SET address='{}' WHERE id=md5('cursor-mo-1')::uuid",
          );
          throw new Error("rollback fixture");
        }),
      /rollback fixture/,
    );
    await parity();
    const second = randomUUID();
    await db.query(
      "INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status) VALUES($1,'second-search','Second','individual','active')",
      [second],
    );
    await db.query(
      "UPDATE troc.seller_orders SET seller_id=$1 WHERE id=md5('cursor-so-1')::uuid",
      [second],
    );
    await parity();
    await db.exec(
      "DELETE FROM troc.seller_orders WHERE id=md5('cursor-so-40')::uuid; UPDATE troc.seller_orders SET marketplace_order_id=md5('cursor-mo-40')::uuid WHERE id=md5('cursor-so-1')::uuid",
    );
    await parity();
    // A second seller order shares a parent: recipient edits must refresh both.
    await db.query(
      "INSERT INTO troc.seller_orders(id,marketplace_order_id,seller_id,merchandise_cents,shipping_cents,status,quote) VALUES($1,md5('cursor-mo-40')::uuid,$2,0,0,'awaiting_shipment','{}')",
      [randomUUID(), seller],
    );
    await db.exec(
      "UPDATE troc.marketplace_orders SET address=jsonb_build_object('recipient','Both sellers') WHERE id=md5('cursor-mo-40')::uuid",
    );
    await parity();
    await db.exec(
      "UPDATE troc.marketplace_orders SET address=jsonb_build_object('recipient','') WHERE id=md5('cursor-mo-40')::uuid",
    );
    await parity();
    await db.exec(
      "DELETE FROM troc.seller_orders WHERE id=md5('cursor-so-1')::uuid",
    );
    await parity();
    const backend = (q: string) =>
      db.transaction(async (tx) => {
        await tx.exec("SET LOCAL ROLE troc_backend");
        return tx.exec(q);
      });
    await backend("SELECT * FROM troc.seller_order_search LIMIT 1");
    await assert.rejects(
      () => backend("DELETE FROM troc.seller_order_search"),
      /permission denied/,
    );
    await assert.rejects(
      () =>
        backend(
          "SELECT troc.refresh_seller_order_search(md5('cursor-so-2')::uuid)",
        ),
      /permission denied/,
    );
    await db.exec("CREATE ROLE order_search_untrusted");
    await assert.rejects(
      () =>
        db.transaction(async (tx) => {
          await tx.exec("SET LOCAL ROLE order_search_untrusted");
          await tx.exec("SELECT * FROM troc.seller_order_search");
        }),
      /permission denied/,
    );
    const protectedTable = await db.query<{ relrowsecurity: boolean }>(
      "SELECT relrowsecurity FROM pg_class WHERE oid='troc.seller_order_search'::regclass",
    );
    assert.equal(protectedTable.rows[0].relrowsecurity, true);
  } finally {
    await db.close();
  }
});

import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { sellerConversationList } from "../artifacts/api-server/src/modules/seller-platform/conversation-list";
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
    "INSERT INTO troc.marketplace_orders(id,buyer_id,total_cents,idempotency_key,status,address,demo_batch_id) SELECT md5('cursor-mo-'||g)::uuid,$1,100,'cursor-'||g,CASE WHEN g=10000 THEN 'pending' ELSE 'simulated_paid' END,jsonb_build_object('recipient',CASE WHEN g=1 THEN 'Literal 50%_buyer' ELSE 'Buyer '||g END,'province','ON'),CASE WHEN g=1 THEN (SELECT id FROM troc.demo_batches WHERE seed_key='commerce-simulation') ELSE NULL END FROM generate_series(1,10000)g",
    [owner],
  );
  await db.query(
    "INSERT INTO troc.seller_orders(id,marketplace_order_id,seller_id,merchandise_cents,shipping_cents,status,created_at,quote) SELECT md5('cursor-so-'||g)::uuid,md5('cursor-mo-'||g)::uuid,$1,100,0,CASE WHEN g%3=0 THEN 'refunded' WHEN g%3=1 THEN 'partially_refunded' ELSE 'awaiting_shipment' END,'2026-01-01T00:00:00Z'::timestamptz + (g%5)*interval '1 microsecond',jsonb_build_object('totalCents',g%11,'merchandiseCents',g%11,'shipping',jsonb_build_object('cents',0),'lines',jsonb_build_array(jsonb_build_object('quantity',1,'unitCents',g%11,'totalCents',g%11,'listing',jsonb_build_object('variantId',md5('cursor-variant-'||g)::uuid,'name',jsonb_build_object('en','English card','fr','Carte française'),'condition','NM')))) FROM generate_series(1,10000)g",
    [seller],
  );

  await db.query(
    "INSERT INTO troc.order_messages(id,seller_order_id,actor_id,author,body,created_at) SELECT md5('msg-'||g||'-'||h)::uuid,md5('cursor-so-'||g)::uuid,CASE WHEN h%2=0 THEN $1::uuid ELSE $2::uuid END,CASE WHEN h%2=0 THEN 'seller' ELSE 'buyer' END,'Message '||g||'/'||h,'2026-01-02'::timestamptz+h*interval '1 second'+(g%5)*interval '1 microsecond' FROM generate_series(1,10000)g CROSS JOIN generate_series(1,20)h",
    [owner, foreign],
  );
  await db.query(
    "INSERT INTO troc.order_messages(id,seller_order_id,actor_id,author,body,created_at) SELECT md5('hot-'||g)::uuid,md5('cursor-so-1')::uuid,$1,'buyer','Long history '||g,'2026-01-03'::timestamptz+g*interval '1 microsecond' FROM generate_series(1,10000)g",
    [foreign],
  );
  await db.query(
    "INSERT INTO troc.order_message_reads(user_id,message_id) SELECT $1,id FROM troc.order_messages WHERE actor_id=$2 AND seller_order_id<>md5('cursor-so-1')::uuid",
    [owner, foreign],
  );
  await db.exec(
    "ANALYZE troc.order_messages; ANALYZE troc.order_message_reads; ANALYZE troc.seller_orders; ANALYZE troc.marketplace_orders",
  );
  const store = {
    transaction: <T>(work: (sql: Sql) => Promise<T>) =>
      db.transaction(async (tx) => {
        await tx.exec("SET LOCAL ROLE troc_backend");
        return work(tx as Sql);
      }),
  };
  let captured: { q: string; p: unknown[] } | undefined;
  const sql: Sql = {
    query: (q, p) => {
      if (q.startsWith("WITH page AS")) captured = { q, p: p ?? [] };
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
  for (const input of [
    {},
    { filter: "all" },
    { q: "Long history 10000" },
    { q: "absent" },
    { q: "Message" },
  ]) {
    const page = await sellerConversationList(
      sql,
      service,
      principal,
      seller,
      input,
    );
    assert.ok(page.conversations.length <= 20);
    if (!input.q) {
      assert.equal(page.conversations[0].unreadCount, 10010);
      assert.equal(page.conversations[0].lastMessage, "Long history 10000");
    }
    if (input.q === "absent") assert.equal(page.conversations.length, 0);
    assert.ok(captured);
    const plan = await store.transaction((tx) =>
      tx.query(
        "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + captured!.q,
        captured!.p,
      ),
    );
    results.push({ input, rows: page.conversations.length, plan: plan.rows });
  }
  const out = new URL(
    "../docs/evidence/seller-conversation-plans/",
    import.meta.url,
  );
  await mkdir(out, { recursive: true });
  await writeFile(
    new URL("plans.json", out),
    JSON.stringify(
      {
        environment:
          "Disposable PGlite10000orders/210000messages;10000message hot thread;9999eligible orders",
        results,
      },
      null,
      2,
    ),
  );
  console.log("Five plans captured; hot-thread unread10010verified; DB closes");
} finally {
  await db.close();
}

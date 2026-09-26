import {
  sellerConversationContext,
  sellerOperations,
} from "../artifacts/api-server/src/modules/seller-platform/operations";
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
import { sellerConversationList } from "../artifacts/api-server/src/modules/seller-platform/conversation-list";
import { SellerPlatformService } from "../artifacts/api-server/src/modules/seller-platform/service";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
import type { Principal } from "../artifacts/api-server/src/modules/auth/permissions";
test("bounded conversations include old orders, tied activity and per-user unread", async () => {
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
      "INSERT INTO troc.marketplace_orders(id,buyer_id,total_cents,idempotency_key,status,address,demo_batch_id) SELECT md5('cursor-mo-'||g)::uuid,$1,100,'cursor-'||g,CASE WHEN g=320 THEN 'pending' ELSE 'simulated_paid' END,jsonb_build_object('recipient',CASE WHEN g=1 THEN 'Literal 50%_buyer' ELSE 'Buyer '||g END,'province','ON'),CASE WHEN g=1 THEN (SELECT id FROM troc.demo_batches WHERE seed_key='commerce-simulation') ELSE NULL END FROM generate_series(1,320)g",
      [owner],
    );
    await db.query(
      "INSERT INTO troc.seller_orders(id,marketplace_order_id,seller_id,merchandise_cents,shipping_cents,status,created_at,quote) SELECT md5('cursor-so-'||g)::uuid,md5('cursor-mo-'||g)::uuid,$1,100,0,CASE WHEN g%3=0 THEN 'refunded' WHEN g%3=1 THEN 'partially_refunded' ELSE 'awaiting_shipment' END,'2026-01-01T00:00:00Z'::timestamptz + (g%5)*interval '1 microsecond',jsonb_build_object('totalCents',g%11,'merchandiseCents',g%11,'shipping',jsonb_build_object('cents',0),'lines',jsonb_build_array(jsonb_build_object('quantity',1,'unitCents',g%11,'totalCents',g%11,'listing',jsonb_build_object('variantId',md5('cursor-variant-'||g)::uuid,'name',jsonb_build_object('en','English card','fr','Carte française'),'condition','NM')))) FROM generate_series(1,320)g",
      [seller],
    );

    await db.exec(
      "UPDATE troc.seller_orders SET created_at='2025-01-01' WHERE id=md5('cursor-so-1')::uuid",
    );
    await db.query(
      "INSERT INTO troc.order_messages(id,seller_order_id,actor_id,author,body,created_at) SELECT md5('message-'||g)::uuid,md5('cursor-so-'||g)::uuid,$1,'buyer','Message '||g,'2026-01-02'::timestamptz + (g%3)*interval '1 microsecond' FROM generate_series(1,320)g WHERE g<>319",
      [foreign],
    );
    await db.query(
      "INSERT INTO troc.order_messages(id,seller_order_id,actor_id,author,body,created_at) VALUES(md5('latest-message')::uuid,md5('cursor-so-1')::uuid,$1,'seller','Latest 50%_ reply','2026-01-03')",
      [owner],
    );
    const store = {
      transaction: <T>(work: (sql: Sql) => Promise<T>) =>
        db.transaction(async (tx) => {
          await tx.exec("SET LOCAL ROLE troc_backend");
          return work(tx as Sql);
        }),
    };
    const thumbnailBatches: unknown[][] = [];
    const sql: Sql = {
      query: (q, p) => {
        if (Array.isArray(p?.[0])) thumbnailBatches.push(p[0]);
        return store.transaction((tx) => tx.query(q, p));
      },
    };
    const service = new SellerPlatformService(sql, store);
    const principal: Principal = {
      userId: owner,
      roles: [],
      memberships: [{ sellerId: seller, role: "owner", active: true }],
    };
    const first = await sellerConversationList(
      sql,
      service,
      principal,
      seller,
      {},
    );
    const old = (
      await db.query<{ id: string }>("SELECT md5('cursor-so-1')::uuid AS id")
    ).rows[0].id;
    assert.equal(first.conversations[0].id, old);
    assert.equal(first.conversations[0].lastMessage, "Latest 50%_ reply");
    assert.equal(first.conversations[0].unreadCount, 1);
    const legacy = await sellerOperations(sql, service, principal, seller);
    assert.equal(legacy.orders.length, 200);
    assert.equal(legacy.truncated, true);
    assert.ok(
      !legacy.orders.some((o) => o.id === old),
      "old selected order is outside legacy200",
    );
    const context = await sellerConversationContext(
      sql,
      service,
      principal,
      seller,
      old,
    );
    assert.equal(context.order.id, old);
    assert.equal(context.order.lastMessage, "Latest 50%_ reply");
    assert.equal(context.order.lines.length, 1);
    assert.equal(context.order.lines[0].imageUrl, null);
    assert.equal(context.order.totalCents, 1);
    assert.deepEqual(
      thumbnailBatches.at(-1),
      context.order.lines.map((l) => l.variantId),
    );
    const otherSeller = randomUUID();
    await db.query(
      "INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status) VALUES($1,'other-context','Other','individual','active')",
      [otherSeller],
    );
    await db.query(
      "INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES($1,$2,'owner')",
      [otherSeller, owner],
    );
    const both: Principal = {
      ...principal,
      memberships: [
        ...principal.memberships,
        { sellerId: otherSeller, role: "owner", active: true },
      ],
    };
    await assert.rejects(
      () => sellerConversationContext(sql, service, both, otherSeller, old),
      /not_found/,
    );
    await assert.rejects(
      () =>
        sellerConversationList(sql, service, both, otherSeller, {
          cursor: first.nextCursor,
        }),
      /invalid_cursor/,
    );

    const pending = (
      await db.query<{ id: string }>("SELECT md5('cursor-so-320')::uuid AS id")
    ).rows[0].id;
    await assert.rejects(
      () => sellerConversationContext(sql, service, principal, seller, pending),
      /not_found/,
    );
    await assert.rejects(
      () =>
        sellerConversationContext(
          sql,
          service,
          principal,
          seller,
          randomUUID(),
        ),
      /not_found/,
    );
    await assert.rejects(
      () => sellerConversationContext(sql, service, principal, seller, "bad"),
      /invalid_input/,
    );
    const allIds: string[] = [];
    let cursor: string | null = null;
    do {
      const page = await sellerConversationList(
        sql,
        service,
        principal,
        seller,
        { limit: "17", ...(cursor ? { cursor } : {}) },
      );
      allIds.push(...page.conversations.map((x) => x.id));
      cursor = page.nextCursor;
      assert.ok(allIds.length <= 318);
    } while (cursor);
    assert.equal(allIds.length, 318);
    assert.equal(new Set(allIds).size, 318);
    const all = await sellerConversationList(sql, service, principal, seller, {
      filter: "all",
      q: "Buyer 319",
    });
    assert.equal(all.conversations.length, 1);
    assert.equal(all.conversations[0].hasMessages, false);
    assert.equal(
      (
        await sellerConversationList(sql, service, principal, seller, {
          q: "50%_",
        })
      ).conversations.length,
      1,
    );
    assert.equal(
      (
        await sellerConversationList(sql, service, principal, seller, {
          q: "' OR 1=1 --",
        })
      ).conversations.length,
      0,
    );
    for (const input of [{ q: "changed" }, { filter: "all" }, { limit: "19" }])
      await assert.rejects(
        () =>
          sellerConversationList(sql, service, principal, seller, {
            ...input,
            cursor: first.nextCursor,
          }),
        /invalid_cursor/,
      );
    for (const input of [
      { cursor: "!" },
      { limit: "51" },
      { filter: "bad" },
      { q: ["a"] },
    ])
      await assert.rejects(
        () => sellerConversationList(sql, service, principal, seller, input),
        /invalid_/,
      );
    await db.query(
      "INSERT INTO troc.order_message_reads(user_id,message_id) VALUES($1,md5('message-1')::uuid)",
      [owner],
    );
    assert.equal(
      (
        await sellerConversationList(sql, service, principal, seller, {
          q: "50%_",
        })
      ).conversations[0].unreadCount,
      0,
    );
    await db.query(
      "INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES($1,$2,'customer_service')",
      [seller, foreign],
    );
    const staff: Principal = {
      userId: foreign,
      roles: [],
      memberships: [
        { sellerId: seller, role: "customer_service", active: true },
      ],
    };
    assert.equal(
      (await sellerConversationList(sql, service, staff, seller, { q: "50%_" }))
        .conversations[0].unreadCount,
      1,
    );
    const denied: Principal = {
      ...principal,
      memberships: [{ sellerId: seller, role: "inventory", active: true }],
    };
    await assert.rejects(
      () => sellerConversationList(sql, service, denied, seller, {}),
      /forbidden/,
    );
    await assert.rejects(
      () => sellerConversationContext(sql, service, denied, seller, old),
      /forbidden/,
    );
    const fulfillment: Principal = {
      ...principal,
      memberships: [{ sellerId: seller, role: "fulfillment", active: true }],
    };
    assert.equal(
      (await sellerConversationList(sql, service, fulfillment, seller, {}))
        .canReply,
      false,
    );
    // New message reorders an existing order; refresh must expose it without a 200-order cap.
    await db.query(
      "INSERT INTO troc.order_messages(seller_order_id,actor_id,author,body,created_at) VALUES(md5('cursor-so-300')::uuid,$1,'buyer','New activity','2026-01-04')",
      [foreign],
    );
    assert.equal(
      (await sellerConversationList(sql, service, principal, seller, {}))
        .conversations[0].lastMessage,
      "New activity",
    );
    assert.equal(
      (
        await db.query<{ n: number }>(
          "SELECT count(*)::int AS n FROM troc.order_message_reads",
        )
      ).rows[0].n,
      1,
      "listing never marks messages read",
    );
    const require = createRequire(
      new URL("../artifacts/api-server/package.json", import.meta.url),
    );
    const express: typeof import("express") = require("express");
    const app = express();
    app.use(sellerPlatformRouter(sql, store, async () => principal));
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
        "/conversations";
      const detailResponse = await fetch(url + "/" + old);
      assert.equal(detailResponse.status, 200);
      assert.equal((await detailResponse.json()).order.id, old);
      assert.equal((await fetch(url + "/" + pending)).status, 404);
      const response = await fetch(url + "?limit=2");
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.equal(payload.conversations.length, 2);
      assert.ok(payload.nextCursor);
      assert.equal((await fetch(url + "?limit=51")).status, 400);
      assert.equal(
        (await fetch(url + "?filter=all&filter=conversations")).status,
        400,
      );
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
    const stranger: Principal = {
      userId: randomUUID(),
      roles: [],
      memberships: [],
    };
    await assert.rejects(
      () => sellerConversationList(sql, service, stranger, seller, {}),
      /forbidden|unauthorized/,
    );
    await db.exec(
      "UPDATE troc.seller_accounts SET status='suspended' WHERE slug='cursor-store'",
    );
    await assert.rejects(
      () => sellerConversationList(sql, service, principal, seller, {}),
      /forbidden|not_found/,
    );
  } finally {
    await db.close();
  }
});

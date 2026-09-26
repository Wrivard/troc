import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { OrderService } from "../artifacts/api-server/src/modules/commerce/orders";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
import type { Principal } from "../artifacts/api-server/src/modules/auth/permissions";
test("order message pages and read markers preserve buyer/seller scope and future unread messages", async () => {
  const db = new PGlite({ extensions: { pg_trgm } });
  try {
    for (const file of (await readdir("lib/db/migrations"))
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await db.exec(await readFile("lib/db/migrations/" + file, "utf8"));
    const [buyer, owner, outsider, seller, parent, child] = Array.from(
      { length: 6 },
      () => randomUUID(),
    );
    for (const user of [buyer, owner, outsider])
      await db.query("INSERT INTO troc.users(id,email) VALUES($1,$2)", [
        user,
        user + "@example.test",
      ]);
    await db.query(
      "INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status) VALUES($1,'fixture','Fixture','individual','active')",
      [seller],
    );
    await db.query(
      "INSERT INTO troc.marketplace_orders(id,buyer_id,total_cents,idempotency_key,status,quote) VALUES($1,$2,100,$3,'shipped',$4)",
      [
        parent,
        buyer,
        randomUUID(),
        JSON.stringify({ totalCents: 100, groups: [] }),
      ],
    );
    await db.query(
      "INSERT INTO troc.seller_orders(id,marketplace_order_id,seller_id,merchandise_cents,shipping_cents,status,quote) VALUES($1,$2,$3,100,0,'shipped',$4)",
      [
        child,
        parent,
        seller,
        JSON.stringify({ totalCents: 100, lines: [], seller: { id: seller } }),
      ],
    );
    await db.query(
      "INSERT INTO troc.order_messages(seller_order_id,actor_id,author,body,created_at) SELECT $1,$2,'buyer','Message '||n,'2026-09-24T00:00:00Z' FROM generate_series(1,205) n",
      [child, buyer],
    );
    const person = (userId: string): Principal => ({
      userId,
      roles: [],
      memberships:
        userId === owner
          ? [{ sellerId: seller, role: "owner", active: true }]
          : [],
    });
    // Pre-sale blocking must not hide order history or read-state access.
    await db.query(
      "INSERT INTO troc.store_enquiry_controls(seller_id,buyer_id,blocked) VALUES($1,$2,true)",
      [seller, buyer],
    );
    const service = new OrderService({
      transaction: (work) =>
        db.transaction(async (tx) => {
          await tx.exec("SET LOCAL ROLE troc_backend");
          return work(tx as Sql);
        }),
    });
    const expected = (
      await db.query<{ id: string }>(
        "SELECT id FROM troc.order_messages WHERE seller_order_id=$1 ORDER BY created_at,id",
        [child],
      )
    ).rows.map((r) => r.id);
    const pages: string[][] = [];
    let before: string | undefined;
    do {
      const page = await service.messagePage(
        db,
        person(owner),
        child,
        true,
        before,
      );
      assert.ok(page.messages.length <= 100);
      pages.unshift(page.messages.map((m) => m.id));
      before = page.nextBefore ?? undefined;
    } while (before);
    assert.deepEqual(pages.flat(), expected);
    assert.equal(
      (await service.messagePage(db, person(owner), child, true)).unreadCount,
      205,
    );
    assert.equal(
      (await service.messagePage(db, person(buyer), parent)).unreadCount,
      0,
    );
    await assert.rejects(
      service.messagePage(db, person(outsider), parent),
      /not_found/,
    );
    await assert.rejects(
      service.markMessagesRead(person(outsider), child, true),
      /not_found/,
    );
    await assert.rejects(
      service.messagePage(db, person(owner), child, true, randomUUID()),
      /invalid_cursor/,
    );
    await service.markMessagesRead(person(buyer), parent);
    assert.equal(
      (await service.messagePage(db, person(owner), child, true)).unreadCount,
      205,
    );
    await service.markMessagesRead(person(owner), child, true);
    await service.markMessagesRead(person(owner), child, true);
    assert.equal(
      (await service.messagePage(db, person(owner), child, true)).unreadCount,
      0,
    );
    await db.query(
      "INSERT INTO troc.order_messages(seller_order_id,actor_id,author,body) VALUES($1,$2,'buyer','New after read')",
      [child, buyer],
    );
    assert.equal(
      (await service.messagePage(db, person(owner), child, true)).unreadCount,
      1,
    );
  } finally {
    await db.close();
  }
});

import express, {type Request,type Response,type NextFunction} from "express";
import {sellerPlatformRouter} from "../artifacts/api-server/src/routes/seller-platform";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import {
  PromotionPublication,
  publishableRule,
} from "../artifacts/api-server/src/modules/seller-platform/promotion-publication";
import { SellerPlatformService } from "../artifacts/api-server/src/modules/seller-platform/service";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
import type { Principal } from "../artifacts/api-server/src/modules/auth/permissions";
test("publication explicitly converts inclusive UTC dates", () => {
  const d = {
    id: randomUUID(),
    name: "Leap",
    minimum: 2,
    percent: 15,
    coupon: "",
    start: "2028-02-29",
    end: "2028-02-29",
  };
  const r = publishableRule(d, "UTC");
  assert.equal(r.startsAt, "2028-02-29T00:00:00.000Z");
  assert.equal(r.endsAt, "2028-03-01T00:00:00.000Z");
  assert.equal(r.basisPoints, 1500);
  assert.equal(publishableRule({...d,minimumCents:1250},"UTC").minimumCents,1250);
  assert.equal(r.minimumCents,undefined);
  for (const amount of [-1,12.5,100000001]) assert.throws(()=>publishableRule({...d,minimumCents:amount},"UTC"));
  assert.throws(() => publishableRule(d, undefined), /timezone/);
  assert.throws(() => publishableRule({ ...d, start: "2027-02-29" }, "UTC"));
});
test("publication access, versions, immutable replay, limits and atomic audit", async () => {
  const db = new PGlite({ extensions: { pg_trgm } });
  try {
    const dir = new URL("../lib/db/migrations/", import.meta.url);
    for (const f of (await readdir(dir))
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await db.exec(await readFile(new URL(f, dir), "utf8"));
    const owner = randomUUID(),
      other = randomUUID(),
      seller = randomUUID();
    await db.query(
      "INSERT INTO troc.users(id,email) VALUES($1,'owner@test.invalid'),($2,'other@test.invalid')",
      [owner, other],
    );
    await db.query(
      "INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status) VALUES($1,'publication-test','Test','individual','active')",
      [seller],
    );
    await db.query(
      "INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES($1,$2,'owner')",
      [seller, owner],
    );
    await db.query("INSERT INTO troc.seller_settings(seller_id) VALUES($1)", [
      seller,
    ]);
    const store = {
      transaction: <T>(fn: (sql: Sql) => Promise<T>) =>
        db.transaction(async (tx) => {
          await tx.exec("SET LOCAL ROLE troc_backend");
          return fn(tx as Sql);
        }),
    };
    const service = new SellerPlatformService(db as Sql, store),
      publication = new PromotionPublication(db as Sql, store, service);
    const p = (id: string): Principal => ({
      userId: id,
      roles: ["admin"],
      memberships: [],
    });
    const draft = {
      id: randomUUID(),
      name: "Test",
      minimum: 2,
      percent: 10,
      coupon: "TEST10",
      start: "2026-09-25",
      end: "2026-09-27",
    };
    await service.savePromotionDrafts(p(owner), seller, {
      key: randomUUID(),
      version: 0,
      drafts: [draft],
    });
    const cmd = {
      key: randomUUID(),
      version: 0,
      action: "publish",
      draftId: draft.id,
      draftVersion: 1,
      calendarTimeZone: "UTC",
    };
    await assert.rejects(
      () => publication.command(p(other), seller, cmd),
      /forbidden/,
    );
    await assert.rejects(
      () => publication.command(p(owner), seller, { ...cmd, draftVersion: 0 }),
      /settings_changed/,
    );
    const first = await publication.command(p(owner), seller, cmd);
    assert.deepEqual(await publication.command(p(owner), seller, cmd), first);
    await assert.rejects(
      () => publication.command(p(owner), seller, { ...cmd, version: 1 }),
      /idempotency_conflict/,
    );
    let current = await publication.read(p(owner), seller);
    assert.equal(current.version, 1);
    assert.equal((current.promotions as unknown[]).length, 1);
    await publication.command(p(owner), seller, {
      key: randomUUID(),
      version: 1,
      action: "unpublish",
      draftId: draft.id,
    });
    await publication.command(p(owner), seller, cmd);
    current = await publication.read(p(owner), seller);
    assert.equal(current.version, 2);
    assert.deepEqual(current.promotions, []);
    await assert.rejects(
      () =>
        publication.command(p(owner), seller, { ...cmd, key: randomUUID() }),
      /promotions_changed/,
    );
    await db.exec(
      "CREATE FUNCTION troc.reject_test_promotion_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='seller.promotion.publish' THEN RAISE EXCEPTION 'test_audit_failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER fail_promotion_audit BEFORE INSERT ON troc.audit_events FOR EACH ROW EXECUTE FUNCTION troc.reject_test_promotion_audit();",
    );
    await assert.rejects(
      () =>
        publication.command(p(owner), seller, {
          ...cmd,
          key: randomUUID(),
          version: 2,
        }),
      /test_audit_failure/,
    );
    assert.equal((await publication.read(p(owner), seller)).version, 2);
    await db.exec("DROP TRIGGER fail_promotion_audit ON troc.audit_events");
    await db.query(
      "UPDATE troc.seller_settings SET promotions=$2 WHERE seller_id=$1",
      [
        seller,
        JSON.stringify(
          Array.from({ length: 20 }, (_, i) => ({
            id: "legacy" + i,
            basisPoints: 100,
          })),
        ),
      ],
    );
    await assert.rejects(
      () =>
        publication.command(p(owner), seller, {
          ...cmd,
          key: randomUUID(),
          version: 2,
        }),
      /promotion_limit/,
    );
    await db.query(
      "UPDATE troc.seller_settings SET promotions=$2 WHERE seller_id=$1",
      [
        seller,
        JSON.stringify([{ id: "other", basisPoints: 100, coupon: "TEST10" }]),
      ],
    );
    await assert.rejects(
      () =>
        publication.command(p(owner), seller, {
          ...cmd,
          key: randomUUID(),
          version: 2,
        }),
      /duplicate_coupon/,
    );
    const app=express();app.use(express.json());let actor=owner;
    app.use(sellerPlatformRouter(db as Sql,store,async()=>p(actor)));
    app.use((e:{status?:number;code?:string},_req:Request,res:Response,_next:NextFunction)=>{res.status(e.status??500).json({code:e.code});});
    const server=app.listen(0,"127.0.0.1");await new Promise<void>(resolve=>server.once("listening",resolve));
    try {
      const address=server.address();if(!address||typeof address==='string')throw Error('missing address');
      const url=`http://127.0.0.1:${address.port}/seller/platform/${seller}/promotions`;
      const response=await fetch(url);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');const snapshot=await response.json();assert.equal(snapshot.draftVersion,1);assert.equal(snapshot.drafts[0].id,draft.id);
      actor=other;assert.equal((await fetch(url)).status,403);
      actor=owner;const bad=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...cmd,key:randomUUID(),calendarTimeZone:'browser'})});assert.equal(bad.status,400);assert.equal(bad.headers.get('cache-control'),'no-store');
    } finally {await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
    await db.exec("CREATE ROLE publication_browser NOLOGIN; SET ROLE publication_browser");
    await assert.rejects(
      () => db.query("SELECT * FROM troc.seller_promotion_commands"),
      /permission denied/,
    );
    await db.exec("RESET ROLE");
  } finally {
    await db.close();
  }
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { createRequire } from "node:module";
import { SellerPlatformService } from "../artifacts/api-server/src/modules/seller-platform/service";
import { sellerPlatformRouter } from "../artifacts/api-server/src/routes/seller-platform";
import { DomainError } from "../artifacts/api-server/src/modules/shared/domain";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
import type { Principal } from "../artifacts/api-server/src/modules/auth/permissions";
import type { Request, Response, NextFunction } from "express";
test("seller/team display pagination is bounded, stable and never limits authorization", async () => {
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
    for (const id of [owner, other])
      await db.query("INSERT INTO troc.users(id,email)VALUES($1,$2)", [
        id,
        id + "@example.test",
      ]);
    await db.query(
      "INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status)VALUES($1,$2,'Store','individual','active')",
      [seller, "store-" + seller],
    );
    await db.query(
      "INSERT INTO troc.seller_members(seller_id,user_id,role)VALUES($1,$2,'owner')",
      [seller, owner],
    );
    await db.exec(
      "INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status)SELECT md5('page-seller-'||g)::uuid,'page-seller-'||g,'Same store','individual','active' FROM generate_series(1,101)g",
    );
    await db.query(
      "INSERT INTO troc.seller_members(seller_id,user_id,role)SELECT id,$1,'owner' FROM troc.seller_accounts WHERE slug LIKE 'page-seller-%'",
      [owner],
    );
    await db.exec(
      "INSERT INTO troc.users(id,email)SELECT md5('page-user-'||g)::uuid,'page-user-'||g||'@example.test'FROM generate_series(1,251)g",
    );
    await db.query(
      "INSERT INTO troc.seller_members(seller_id,user_id,role)SELECT $1,id,'inventory'FROM troc.users WHERE email LIKE 'page-user-%'",
      [seller],
    );
    const store = {
      transaction: <T>(work: (sql: Sql) => Promise<T>) =>
        db.transaction(async (tx) => {
          await tx.exec("SET LOCAL ROLE troc_backend");
          return work(tx as Sql);
        }),
    };
    const sql: Sql = {
        query: (q, p) => store.transaction((tx) => tx.query(q, p)),
      },
      service = new SellerPlatformService(sql, store),
      p = (id: string): Principal => ({
        userId: id,
        roles: [],
        memberships: [],
      });
    const sellers = [];
    for (let page = 0; page < 3; page++) {
      const rows = await service.sellers(p(owner), page);
      assert.ok(rows.length <= 50);
      assert.deepEqual(rows, await service.sellers(p(owner), page));
      sellers.push(...rows);
    }
    assert.equal(sellers.length, 102);
    assert.equal(new Set(sellers.map((s) => s.id)).size, 102);
    assert.equal((await service.sellers(p(owner), 3)).length, 0);
    assert.equal((await service.sellers(p(other))).length, 0);
    const members = [];
    for (let page = 0; page < 6; page++) {
      const rows = await service.team(p(owner), seller, page);
      assert.ok(rows.length <= 50);
      assert.deepEqual(rows, await service.team(p(owner), seller, page));
      members.push(...rows);
    }
    assert.equal(members.length, 252);
    assert.equal(new Set(members.map((m) => m.user_id)).size, 252);
    assert.equal((await service.team(p(owner), seller, 6)).length, 0);
    await assert.rejects(() => service.team(p(other), seller, 1), /forbidden/);
    for (const page of [-1, 0.5, NaN, Infinity, 10001]) {
      await assert.rejects(
        () => service.sellers(p(owner), page),
        /invalid_page/,
      );
      await assert.rejects(
        () => service.team(p(owner), seller, page),
        /invalid_page/,
      );
    }
    const last = String(members.at(-1)!.user_id);
    await service.member(p(owner), seller, { userId: last, role: "owner" });
    await service.member(p(owner), seller, {
      userId: owner,
      role: "inventory",
    });
    assert.equal(
      (await service.team(p(last), seller, 0)).some((m) => m.user_id === last),
      false,
    );
    await assert.rejects(
      () => service.member(p(last), seller, { userId: last, role: null }),
      /last_owner/,
    );
    assert.equal((await service.dashboard(p(last), seller)).currency, "CAD");
    const require = createRequire(
        new URL("../artifacts/api-server/package.json", import.meta.url),
      ),
      express: typeof import("express") = require("express"),
      app = express();
    app.use(sellerPlatformRouter(sql, store, async () => p(last)));
    app.use(
      (error: unknown, _req: Request, res: Response, _next: NextFunction) =>
        res
          .status(error instanceof DomainError ? error.status : 500)
          .json({ error: true }),
    );
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    try {
      const base =
        "http://127.0.0.1:" + (server.address() as { port: number }).port;
      for (const page of ["bad", "-1", "1.5", "10001", "Infinity"])
        assert.equal(
          (await fetch(`${base}/seller/platform/${seller}/team?page=${page}`))
            .status,
          400,
        );
      const response = await fetch(
        `${base}/seller/platform/${seller}/team?page=5`,
      );
      assert.equal(response.status, 200);
      assert.equal((await response.json()).length, 2);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  } finally {
    await db.close();
  }
});

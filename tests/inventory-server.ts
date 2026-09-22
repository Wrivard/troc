/** Local-only test identity and in-memory database. Never import into production. */
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { createRequire } from "node:module";
import { readFile, readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
import { seedCommerceDemo } from "../artifacts/api-server/src/modules/commerce/seed-demo";
import { inventoryRouter } from "../artifacts/api-server/src/routes/inventory";
import { DomainError } from "../artifacts/api-server/src/modules/shared/domain";
async function main() {
  const require = createRequire(
    new URL("../artifacts/api-server/package.json", import.meta.url),
  );
  const express: typeof import("express") = require("express");
  const db = new PGlite({ extensions: { pg_trgm } });
  const dir = new URL("../lib/db/migrations/", import.meta.url);
  for (const file of (await readdir(dir))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(await readFile(new URL(file, dir), "utf8"));
  await seedCommerceDemo(db);
  const user = randomUUID();
  await db.query("INSERT INTO troc.users(id,email) VALUES($1,$2)", [
    user,
    user + "@example.test",
  ]);
  const sellers = (
    await db.query<{ id: string }>(
      "SELECT id FROM troc.seller_accounts ORDER BY id",
    )
  ).rows;
  await db.query(
    "INSERT INTO troc.seller_members(seller_id,user_id,role) SELECT id,$1,'owner' FROM troc.seller_accounts",
    [user],
  );
  const identity = async (req: Request) => {
    if (req.headers.cookie?.includes("inventory_denied=1"))
      throw new DomainError("unauthorized", 401);
    return {
      userId: user,
      roles: [],
      memberships: sellers.map((s) => ({
        sellerId: s.id,
        role: "owner" as const,
        active: true,
      })),
    };
  };
  const app = express();
  app.use(express.json({ limit: "5mb" }));
  app.use(
    "/api",
    inventoryRouter(
      db as Sql,
      {
        transaction: (work) =>
          db.transaction(async (tx) => {
            await tx.exec("SET LOCAL ROLE troc_backend");
            return work(tx as Sql);
          }),
      },
      identity,
      10000,
    ),
  );
  app.use((e: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(e);
    res
      .status(e instanceof DomainError ? e.status : 500)
      .json({
        code: e instanceof DomainError ? e.code : "service_unavailable",
      });
  });
  app.listen(3015, "127.0.0.1", () => console.log("Inventory test API :3015"));
}
void main();

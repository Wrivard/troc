/** Local-only integration harness; never imported by application/runtime builds. */
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import {
  commerceRouter,
  commerceQuoteRouter,
} from "../artifacts/api-server/src/routes/commerce";
import catalogRouter from "../artifacts/api-server/src/routes/catalog";
import { seedCommerceDemo } from "../artifacts/api-server/src/modules/commerce/seed-demo";
import { demoCommerce } from "../artifacts/api-server/src/modules/commerce/data";
import { DomainError } from "../artifacts/api-server/src/modules/shared/domain";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
import type { TransactionStore } from "../artifacts/api-server/src/modules/commerce/checkout";
async function main() {
  const require = createRequire(
    new URL("../artifacts/api-server/package.json", import.meta.url),
  );
  const express: typeof import("express") = require("express");
  const app = express();
  app.use(express.json({ limit: "64kb" }));
  const db = new PGlite({ extensions: { pg_trgm } });
  const directory = new URL("../lib/db/migrations/", import.meta.url);
  for (const name of (await readdir(directory))
    .filter((n) => n.endsWith(".sql"))
    .sort())
    await db.exec(await readFile(new URL(name, directory), "utf8"));
  const commerce = demoCommerce(),
    buyer = randomUUID(),
    owner = randomUUID(),
    batch = randomUUID();
  await db.query(
    "INSERT INTO troc.demo_batches(id,seed_key) VALUES($1,'commerce-browser')",
    [batch],
  );
  for (const id of [buyer, owner])
    await db.query(
      "INSERT INTO troc.users(id,email,demo_batch_id) VALUES($1,$2,$3)",
      [id, id + "@example.test", batch],
    );
  await seedCommerceDemo(db);
  await seedCommerceDemo(db);
  await db.query(
    "INSERT INTO troc.credit_ledger(user_id,kind,cents,idempotency_key) VALUES($1,'promotional',500,'browser-promo')",
    [buyer],
  );
  const store: TransactionStore = {
    transaction: (work) =>
      db.transaction(async (tx) => {
        await tx.exec("SET LOCAL ROLE troc_backend");
        return work(tx as Sql);
      }),
  };
  const identity = async (req: Request) => ({
    userId: req.headers.cookie?.includes("test_role=seller") ? owner : buyer,
    roles: [],
    memberships: req.headers.cookie?.includes("test_role=seller")
      ? commerce.sellers.map((s) => ({
          sellerId: s.id,
          role: "owner" as const,
          active: true,
        }))
      : [],
  });
  app.use("/api", catalogRouter);
  app.use("/api", commerceQuoteRouter(db, false, 10000));
  app.use("/api", commerceRouter(db, store, identity, false, 10000));
  app.get("/api/test-fixture", (_req, res) =>
    res.json({
      listings: commerce.listings.filter(
        (l) => l.cents <= 50 && l.condition === "NM" && l.imageUrl,
      ),
      sellers: commerce.sellers,
    }),
  );
  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      console.error(error);
      res.status(error instanceof DomainError ? error.status : 500).json({
        code: error instanceof DomainError ? error.code : "service_unavailable",
      });
    },
  );
  app.listen(3002, "127.0.0.1", () =>
    console.log("Commerce test API ready :3002"),
  );
}
void main();

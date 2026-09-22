import { pathToFileURL } from "node:url";
/** Local-only harness: no production authentication bypass is exported. */
import { createRequire } from "node:module";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { SellerPlatformService } from "../artifacts/api-server/src/modules/seller-platform/service";
import { sellerPlatformRouter } from "../artifacts/api-server/src/routes/seller-platform";
import { DomainError } from "../artifacts/api-server/src/modules/shared/domain";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
import type { Request, Response, NextFunction } from "express";
const require = createRequire(
  new URL("../artifacts/api-server/package.json", import.meta.url),
);
const express: typeof import("express") = require("express");
async function main() {
  const db = new PGlite({ extensions: { pg_trgm } }),
    dir = new URL("../lib/db/migrations/", import.meta.url);
  for (const file of (await readdir(dir))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(await readFile(new URL(file, dir), "utf8"));
  const owner = "00000000-0000-4000-8000-000000000001",
    admin = "00000000-0000-4000-8000-000000000002",
    applicant = "00000000-0000-4000-8000-000000000003";
  for (const [i, id] of [owner, admin, applicant].entries())
    await db.query("INSERT INTO troc.users(id,email) VALUES($1,$2)", [
      id,
      `seller${i}@example.test`,
    ]);
  await db.query(
    "INSERT INTO troc.user_roles(user_id,role) VALUES($1,'admin')",
    [admin],
  );
  const store = {
    transaction: <T>(work: (sql: Sql) => Promise<T>) =>
      db.transaction(async (tx) => {
        await tx.exec("SET LOCAL ROLE troc_backend");
        return work(tx as Sql);
      }),
  };
  const service = new SellerPlatformService(db as Sql, store),
    p = (id: string) => ({ userId: id, roles: [], memberships: [] });
  const application = await service.submit(p(owner), {
    contactName: "Test owner",
    displayName: "Local test store",
    country: "CA",
    province: "QC",
    sellerType: "individual",
    adultConfirmed: true,
  });
  await service.review(p(admin), String(application.id), {
    decision: "approved",
    note: "Test-only fixture",
  });
  const identity = async (req: Request) => {
    if (req.headers.cookie?.includes("seller_denied=1"))
      throw new DomainError("unauthorized", 401);
    return p(
      req.headers.cookie?.includes("seller_admin=1")
        ? admin
        : req.headers.cookie?.includes("seller_applicant=1")
          ? applicant
          : owner,
    );
  };
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  app.post("/api/seller/applications", async (req, res) =>
    res.status(201).json(await service.submit(await identity(req), req.body)),
  );
  app.use("/api", sellerPlatformRouter(db as Sql, store, identity));
  app.use((e: unknown, _req: Request, res: Response, _next: NextFunction) =>
    res.status(e instanceof DomainError ? e.status : 500).json({
      code: e instanceof DomainError ? e.code : "service_unavailable",
    }),
  );
  app.listen(4311, "127.0.0.1", () => console.log("Seller test API :4311"));
  const marketRequire = createRequire(
    new URL("../artifacts/marketplace/package.json", import.meta.url),
  );
  const { createServer } = await import(
    pathToFileURL(marketRequire.resolve("vite")).href
  );
  const server = await createServer({
    root: new URL("../artifacts/marketplace", import.meta.url).pathname.replace(
      /^\/([A-Za-z]:)/,
      "$1",
    ),
    server: {
      port: 5311,
      host: "127.0.0.1",
      strictPort: true,
      proxy: { "/api": "http://127.0.0.1:4311" },
    },
    plugins: [
      {
        name: "seller-harness",
        configureServer(s) {
          s.middlewares.use(async (req, res, next) => {
            if (
              req.url?.startsWith("/seller/") ||
              req.url?.startsWith("/admin/")
            ) {
              res.setHeader("Content-Type", "text/html");
              res.end(
                await s.transformIndexHtml(
                  req.url,
                  '<!doctype html><html lang="en"><head><title>Seller test harness</title></head><body><div id="root"></div><script type="module" src="/src/modules/seller-platform/harness.tsx"></script></body></html>',
                ),
              );
            } else next();
          });
        },
      },
    ],
  });
  await server.listen();
  console.log("Seller UI harness :5311");
}
void main();
